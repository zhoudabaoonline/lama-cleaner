/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
import { FolderIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { PlayIcon, ReloadIcon, } from '@radix-ui/react-icons'
import { AlignLeft } from 'react-feather'
import _ from "lodash"

import React, { useCallback, useState } from 'react'
import { useRecoilState, useRecoilValue } from 'recoil'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import inpaint, { textRecognition, uploadImage } from "../../adapters/inpainting"
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
    trGlobalState,
    FileName,
    negativePropmtState,
    propmtState,
    seedState,
    settingState,
    croperState,
    imageWidthState,
    rendersState
} from '../../store'
import Button from '../shared/Button'
import Shortcuts from '../Shortcuts/Shortcuts'
import { ThemeChanger } from './ThemeChanger'
import SettingIcon from '../Settings/SettingIcon'
import PromptInput from './PromptInput'
import CoffeeIcon from '../CoffeeIcon/CoffeeIcon'
import emitter, { EVENT_CUSTOM_MASK, RERUN_LAST_MASK } from '../../event'
import { getTextRectCord, loadImage, useImage, dataURItoBlob, blobToImg } from '../../utils'
import useHotKey from '../../hooks/useHotkey'
import { LoadingIcon } from '../shared/Toast'





const Header = () => {
    const [isInpainting, setIsInpainting] = useRecoilState(isInpaintingState)
    const [fileName, setFileName] = useRecoilState(FileName)
    const [file, setFile] = useRecoilState(fileState)
    // const [original, isOriginalLoaded] = useImage(file)
    const [renders, setRenders] = useRecoilState(rendersState)

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
    const promptVal = useRecoilValue(propmtState)
    const negativePromptVal = useRecoilValue(negativePropmtState)
    const settings = useRecoilValue(settingState)
    const [seedVal, setSeed] = useRecoilState(seedState)
    const croperRect = useRecoilValue(croperState)

    const [isUnRe, setTextRectUndoRedo] = useRecoilState(textRectListUndoRedo)

    const [TextRectLists, setTextRectList] = useRecoilState(textRectList)

    const offsetHeight = parseInt(`${process.env.REACT_APP_OFFSET_HEIGHT}`, 10)
    const offsetWidth = parseInt(`${process.env.REACT_APP_OFFSET_WIDTH}`, 10)



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

            await textRecognition(fileName, undefined)
                .then(res => {
                    if (res.ok) {
                        res.json().then((responseObj: TextRectListState) => {
                            const trSpliceHeight = responseObj.tr_splice_height
                            setTrGlobal({ tr_splice_height: trSpliceHeight })
                            const items = responseObj.text_array
                            if (items) {
                                items.forEach((item) => {
                                    if (item) {
                                        getTextRectCord(item, trSpliceHeight)
                                        item.size = item.lineHeight
                                        item.height = item.lineHeight
                                        item.space = 0
                                        item.color = "black"
                                        item.family = 'Microsoft YaHei'
                                        item.info.trans = ""
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
                                    const newFiles = ev.currentTarget.files?.[0]
                                    if (newFiles) {
                                        // setFile(newFiles)
                                        setFile(newFiles)

                                        // await uploadImage(newFiles).then((resa) => {
                                        //     //     console.log("-----------------------------------------")
                                        //     // setFile(newFiles)
                                        //     // setIsInpainting(true)

                                        //     setFileName(resa.filename)
                                        //     // 创建蒙版文件, 提交获取处理过的图片
                                        //     const hh = URL.createObjectURL(newFiles)
                                        //     const newimage = new Image()
                                        //     newimage.src = hh
                                        //     newimage.onload = async () => {
                                        //         const tempMask = document.createElement("canvas")
                                        //         tempMask.width = newimage.width
                                        //         tempMask.height = newimage.height
                                        //         setFile(newFiles)

                                        //         await inpaint(
                                        //             resa.filename,
                                        //             settings,
                                        //             croperRect,
                                        //             promptVal,
                                        //             negativePromptVal,
                                        //             seedVal,
                                        //             tempMask.toDataURL(),
                                        //             undefined,
                                        //             undefined
                                        //         ).then((res) => {
                                        //             if (!res) {
                                        //                 console.log("Something went wrong on server side.服务端报错")
                                        //                 throw new Error('Something went wrong on server side.服务端报错')
                                        //             }
                                        //             const { blob, seed } = res
                                        //             console.log(URL.createObjectURL(blob), "dddddddddddddddddd")

                                        //             if (seed) {
                                        //                 setSeed(parseInt(seed, 10))
                                        //             }
                                        //             // const newRender = new Image()
                                        //             // await loadImage(newRender, URL.createObjectURL(blob))
                                        //             newfiledd = new File([blob], resa.filename, {
                                        //                 type: blob.type,
                                        //             })
                                        //             // setFile(newfiledd)

                                        //             // setIsInpainting(false)
                                        //             console.log("dd--------------------------------")
                                        //             setFile(newfiledd)

                                        //         })
                                        //     }
                                        // })


                                    }
                                }}
                                accept="image/png, image/jpeg"
                            />
                        </Button>
                    </label>


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
