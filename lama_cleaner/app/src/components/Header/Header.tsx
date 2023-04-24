/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
import { FolderIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { PlayIcon, ReloadIcon, } from '@radix-ui/react-icons'
import { AlignLeft } from 'react-feather'
import _ from "lodash"

import React, { useCallback, useState } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { textRecognition } from "../../adapters/inpainting"
import {
    enableFileManagerState,
    fileState,
    isInpaintingState,
    isPix2PixState,
    isSDState,
    maskState,
    runManuallyState,
    showFileManagerState,
    textRectList,
    toastState,
    TextRect,
    TextRectListState,
    isTringState,
    textRectListState,
    textRectListUndoRedo,
    isTrOkState,
    isShowState,
    trGlobalState
} from '../../store'
import Button from '../shared/Button'
import Shortcuts from '../Shortcuts/Shortcuts'
import { ThemeChanger } from './ThemeChanger'
import SettingIcon from '../Settings/SettingIcon'
import PromptInput from './PromptInput'
import CoffeeIcon from '../CoffeeIcon/CoffeeIcon'
import emitter, { EVENT_CUSTOM_MASK, RERUN_LAST_MASK } from '../../event'
import { useImage } from '../../utils'
import useHotKey from '../../hooks/useHotkey'
import Toast from '../shared/Toast'

const Header = () => {
    const isInpainting = useRecoilValue(isInpaintingState)
    const [file, setFile] = useRecoilState(fileState)
    const [mask, setMask] = useRecoilState(maskState)
    const [maskImage, maskImageLoaded] = useImage(mask)
    const [uploadElemId] = useState(`file-upload-${Math.random().toString()}`)
    const [maskUploadElemId] = useState(`mask-upload-${Math.random().toString()}`)
    const isSD = useRecoilValue(isSDState)
    const isPix2Pix = useRecoilValue(isPix2PixState)
    const runManually = useRecoilValue(runManuallyState)
    const [openMaskPopover, setOpenMaskPopover] = useState(false)
    const [showFileManager, setShowFileManager] = useRecoilState(showFileManagerState)
    const enableFileManager = useRecoilValue(enableFileManagerState)
    const [toastValue, setToastState] = useRecoilState(toastState)
    const [isTring, setIsTring] = useRecoilState(isTringState)
    const [isTrOk, setIsTrOk] = useRecoilState(isTrOkState)
    const [isShow, setIsShow] = useRecoilState(isShowState)
    const [trGlobal, setTrGlobal] = useRecoilState(trGlobalState)

    const [isUnRe, setTextRectUndoRedo] = useRecoilState(textRectListUndoRedo)

    const [TextRectLists, setTextRectList] = useRecoilState(textRectList)

    const rateHeight = 0.2
    const rateWidth = 0.1


    const onClickTR = async () => {
        if (isShow) {
            setIsShow(false)
        } else {
            setIsShow(true)
        }
        if (!isTrOk) {
            setToastState({
                open: true,
                desc: `等待文字识别处理`,
                state: 'loading',
                duration: 10000,
            })

            await textRecognition(file)
                .then(res => {
                    if (res.ok) {
                        res.json().then((responseObj: TextRectListState) => {
                            const kh = responseObj.splice_height
                            const items = responseObj.text_array
                            if (items) {
                                items.forEach((item) => {
                                    if (item) {
                                        const [[x0, y0], [x1,], [, y2],] = [...item.rect]

                                        item.lineHeight = y2 - item.rect[1][1]
                                        item.rectHeight = item.lineHeight * (1 + rateHeight)
                                        item.heightOffset = item.rectHeight * rateHeight / 2
                                        item.left = x0 - 5
                                        item.top = y0 + kh * item.pn - item.heightOffset
                                        item.width = x1 - item.left + 10
                                        item.size = item.rectHeight
                                        item.space = 0
                                        item.family = 'Microsoft YaHei'

                                    }
                                });
                                setTextRectList(items)
                                setIsTring(true)
                                setIsTrOk(true)
                            }
                        })
                        setToastState({
                            open: false,
                            desc: `识别处理完成`,
                            state: 'success',
                            duration: 1000,
                        })

                    } else {
                        throw new Error('Server error1')
                    }
                })
                .catch((err) => {
                    if (err) {
                        console.log(err)
                        throw new Error('Server error2')
                    } else {
                        console.log(err)
                    }
                })
        }
    }


    useHotKey(
        'f',
        () => {
            if (enableFileManager && !isInpainting) {
                setShowFileManager(!showFileManager)
            }
        },
        {},
        [showFileManager, enableFileManager, isInpainting]
    )

    const handleRerunLastMask = useCallback(() => {
        emitter.emit(RERUN_LAST_MASK)
    }, [])

    useHotKey(
        'r',
        () => {
            console.log("r is pressdown")
            if (!isInpainting) {
                handleRerunLastMask()
            }
        },
        {},
        [isInpainting, handleRerunLastMask]
    )

    const testCharGpt = async () => {
        console.log("kaishi---------------------------")
        const temp: { id: any; label: any }[] = []
        const trTemp = _.cloneDeep(TextRectLists.text_array)
        trTemp.forEach((element: { id: any; info: { text: any } }) => {
            temp.push({ id: element.id, label: element.info.text })
        });
        const req = JSON.stringify(temp)
        const promp = "请把下面的json字符串中属性名为label的值取出翻译成韩文,并保存到属性trans中;"
        const t = JSON.stringify({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: promp + req }], temperature: 0.7 })
        try {
            await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer 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'
                },
                body: t,
            }).then(res => res.json()).then(data => {
                console.log("jieshu---------------------------")
                console.log(data.choices[0].message.content)
                const v: [{ id: number, label: string, trans: string }] = JSON.parse(data.choices[0].message.content)
                v.forEach((element, index) => {
                    trTemp[index].info.trans = element.trans
                });
                setTextRectList(trTemp)
                setTrGlobal({ showTrans: true })

                // return data
                console.log("jieshu")
            }).catch((err) => {
                console.log(err);
            })

        } catch (e) {
            console.log(e)
        }


    }


    const undo = () => {
        setTextRectUndoRedo(-1)
    }

    const redo = () => {
        setTextRectUndoRedo(1)
    }

    const renderHeader = () => {
        return (
            <header>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    {enableFileManager ? (
                        <Button
                            icon={<FolderIcon />}
                            style={{ border: 0 }}
                            toolTip="打开文件管理器"
                            disabled={isInpainting}
                            onClick={() => {
                                setShowFileManager(true)
                            }}
                        />
                    ) : (
                        <></>
                    )}

                    <label htmlFor={uploadElemId}>
                        <Button
                            icon={<PhotoIcon />}
                            style={{ border: 0, gap: 0 }}
                            disabled={isInpainting}
                            toolTip="选择上传图片"
                        >
                            <input
                                style={{ display: 'none' }}
                                id={uploadElemId}
                                name={uploadElemId}
                                type="file"
                                onChange={ev => {
                                    const newFile = ev.currentTarget.files?.[0]
                                    if (newFile) {
                                        setFile(newFile)
                                    }
                                }}
                                accept="image/png, image/jpeg"
                            />
                        </Button>
                    </label>



                    <Button
                        icon={<PhotoIcon />}
                        style={{ border: 0, gap: 0 }}
                        disabled={isInpainting}
                        toolTip="一键翻译"
                        onClick={testCharGpt}
                    />

                    {/* 如果文件已经选定,那么才可以显示识别对话框 */}
                    {file ? (
                        <div style={{ display: "flex", flexDirection: "row" }}>
                            <Button
                                onClick={onClickTR}
                                icon={< AlignLeft />}
                                toolTip="识别图片中文字"
                                style={{ border: 0, gap: 0, backgroundColor: isTring && isShow ? "rgba(199, 180, 10, 1)" : "rgba(199, 180, 10, 0)" }}
                            />

                            <Button
                                toolTip="撤销"
                                icon={
                                    <svg
                                        width="19"
                                        height="9"
                                        viewBox="0 0 19 9"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M2 1C2 0.447715 1.55228 0 1 0C0.447715 0 0 0.447715 0 1H2ZM1 8H0V9H1V8ZM8 9C8.55228 9 9 8.55229 9 8C9 7.44771 8.55228 7 8 7V9ZM16.5963 7.42809C16.8327 7.92721 17.429 8.14016 17.9281 7.90374C18.4272 7.66731 18.6402 7.07103 18.4037 6.57191L16.5963 7.42809ZM16.9468 5.83205L17.8505 5.40396L16.9468 5.83205ZM0 1V8H2V1H0ZM1 9H8V7H1V9ZM1.66896 8.74329L6.66896 4.24329L5.33104 2.75671L0.331035 7.25671L1.66896 8.74329ZM16.043 6.26014L16.5963 7.42809L18.4037 6.57191L17.8505 5.40396L16.043 6.26014ZM6.65079 4.25926C9.67554 1.66661 14.3376 2.65979 16.043 6.26014L17.8505 5.40396C15.5805 0.61182 9.37523 -0.710131 5.34921 2.74074L6.65079 4.25926Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                }
                                onClick={undo}
                                disabled={!(isUnRe.un.length > 0)}
                            />
                            <Button
                                toolTip="重做"
                                icon={
                                    <svg
                                        width="19"
                                        height="9"
                                        viewBox="0 0 19 9"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        style={{ transform: 'scale(-1,1)' }}
                                    >
                                        <path
                                            d="M2 1C2 0.447715 1.55228 0 1 0C0.447715 0 0 0.447715 0 1H2ZM1 8H0V9H1V8ZM8 9C8.55228 9 9 8.55229 9 8C9 7.44771 8.55228 7 8 7V9ZM16.5963 7.42809C16.8327 7.92721 17.429 8.14016 17.9281 7.90374C18.4272 7.66731 18.6402 7.07103 18.4037 6.57191L16.5963 7.42809ZM16.9468 5.83205L17.8505 5.40396L16.9468 5.83205ZM0 1V8H2V1H0ZM1 9H8V7H1V9ZM1.66896 8.74329L6.66896 4.24329L5.33104 2.75671L0.331035 7.25671L1.66896 8.74329ZM16.043 6.26014L16.5963 7.42809L18.4037 6.57191L17.8505 5.40396L16.043 6.26014ZM6.65079 4.25926C9.67554 1.66661 14.3376 2.65979 16.043 6.26014L17.8505 5.40396C15.5805 0.61182 9.37523 -0.710131 5.34921 2.74074L6.65079 4.25926Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                }
                                onClick={redo}
                                disabled={!(isUnRe.re.length > 0)}
                            />
                        </div>
                    ) : (<></>)
                    }

                    <div
                        style={{
                            visibility: file ? 'visible' : 'hidden',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <label htmlFor={maskUploadElemId}>
                            <Button
                                style={{ border: 0 }}
                                disabled={isInpainting}
                                toolTip="上传自定义蒙版"
                            >
                                <input
                                    style={{ display: 'none' }}
                                    id={maskUploadElemId}
                                    name={maskUploadElemId}
                                    type="file"
                                    onClick={e => {
                                        const element = e.target as HTMLInputElement
                                        element.value = ''
                                    }}
                                    onChange={ev => {
                                        const newFile = ev.currentTarget.files?.[0]
                                        if (newFile) {
                                            setMask(newFile)
                                            console.info('发送自定义蒙版')
                                            if (!runManually) {
                                                emitter.emit(EVENT_CUSTOM_MASK, { mask: newFile })
                                            }
                                        }
                                    }}
                                    accept="image/png, image/jpeg"
                                />
                                蒙版
                            </Button>
                        </label>

                        {mask ? (
                            <PopoverPrimitive.Root open={openMaskPopover}>
                                <PopoverPrimitive.Trigger
                                    className="btn-primary side-panel-trigger"
                                    onMouseEnter={() => setOpenMaskPopover(true)}
                                    onMouseLeave={() => setOpenMaskPopover(false)}
                                    style={{
                                        visibility: mask ? 'visible' : 'hidden',
                                        outline: 'none',
                                    }}
                                    onClick={() => {
                                        if (mask) {
                                            emitter.emit(EVENT_CUSTOM_MASK, { mask })
                                        }
                                    }}
                                >
                                    <PlayIcon />
                                </PopoverPrimitive.Trigger>
                                <PopoverPrimitive.Portal>
                                    <PopoverPrimitive.Content
                                        style={{
                                            outline: 'none',
                                        }}
                                    >
                                        {maskImageLoaded ? (
                                            <img
                                                src={maskImage.src}
                                                alt="mask"
                                                className="mask-preview"
                                            />
                                        ) : (
                                            <></>
                                        )}
                                    </PopoverPrimitive.Content>
                                </PopoverPrimitive.Portal>
                            </PopoverPrimitive.Root>
                        ) : (
                            <></>
                        )}

                        <Button
                            icon={<ReloadIcon style={{ height: 16, width: 16 }} />}
                            style={{ border: 0, gap: 0 }}
                            disabled={isInpainting}
                            toolTip="Rerun last mask [r]"
                            onClick={handleRerunLastMask}
                        />
                    </div>
                </div>

                {(isSD || isPix2Pix) && file ? <PromptInput /> : <></>}

                <div className="header-icons-wrapper">
                    <CoffeeIcon />
                    <ThemeChanger />
                    <div className="header-icons">
                        <Shortcuts />
                        <SettingIcon />
                    </div>
                </div>
            </header>
        )
    }
    return renderHeader()
}

export default Header
