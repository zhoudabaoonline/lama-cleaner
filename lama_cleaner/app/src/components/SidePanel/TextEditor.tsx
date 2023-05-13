/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable import/no-extraneous-dependencies */
import { FolderIcon, PlusIcon, MinusIcon, ViewfinderCircleIcon, PaintBrushIcon, PhotoIcon } from '@heroicons/react/24/outline'
import React, { useEffect, useRef, useState } from 'react'
import _ from "lodash"

import * as Select from '@radix-ui/react-select';
import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider'

import ChromePicker from 'react-color'

import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from '@radix-ui/react-icons'
import { AlignLeft } from 'react-feather';

import { useRecoilState, useSetRecoilState, useRecoilValue } from 'recoil'

import Selector from '../shared/Selector'
import { getGpt, getTextRectCord } from '../../utils'

import {
    isShowState, isDrawingState, isTrOkState, toastState, drawClick
    , drawTextClick, textRectListModifyState, selectedIndexState, trGlobalState,
    isInpaintingState, textRectList
} from "../../store"
import Button from '../shared/Button'


const MIN_FONT_SIZE = 10
const MAX_FONT_SIZE = 100


const TextEditor = () => {

    const isInpainting = useRecoilValue(isInpaintingState)
    const setToastState = useSetRecoilState(toastState)
    const [isDrawing, setIsDrawing] = useRecoilState(isDrawingState)
    const [isTrOk, setIsTrOk] = useRecoilState(isTrOkState)

    const [isShow, setIsShow] = useRecoilState(isShowState)
    const [isDrawClick, setDrawClick] = useRecoilState(drawClick)
    const [nodeInfo, setTextRectListModify] = useRecoilState(textRectListModifyState)
    const [selectedIndex, setSelectedIndex] = useRecoilState(selectedIndexState)
    const [isShowColorPicker, setIsShowColorPicker] = useState<boolean>(false)
    const [trGlobal, setTrGlobal] = useRecoilState(trGlobalState)
    const [isDrawTextClick, setDrawTextClick] = useRecoilState(drawTextClick)
    const [textRectLists, setTextRectList] = useRecoilState(textRectList)
    const [textRectOffset, setTextRectOffset] = useState<number>(1)
    const [isSelectedAll, setIsSelectedAll] = useState<boolean>(false)
    const [allColor, setAllColor] = useState<string>('#fff000')
    const [allFamily, setAllFamily] = useState<string>('')

    const drawTextRectMask = () => {
        if (isTrOk) {
            // 注意这里的写法
            isDrawClick()
        } else {
            setToastState({
                open: true,
                desc: "请先识别图片上的文字数据",
                state: 'error',
                duration: 4000,
            })
        }
    }


    enum wokao {
        LAMA = `"Microsoft YaHei"`,
        Arial = 'Arial',
        SansSerif = 'sans-serif',
        B = '나무고딕B',
        EB = '나무고딕EB',
        L = '나무고딕L',
        R = '나무고딕R',
        ddd = '(한)고인돌B'
    }


    const zoom = (percent: number) => {
        if (isShow && selectedIndex >= 0) {
            const temp = _.cloneDeep(nodeInfo)
            const { height } = temp
            const add = height * Math.abs(percent) / 100
            if (percent > 0) {
                temp.width += add
                temp.height += add
                temp.left -= add / 2
                temp.top -= add / 2
            } else {
                temp.width -= add
                temp.height -= add
                temp.left += add / 2
                temp.top += add / 2
            }
            temp.size = temp.height
            setTextRectListModify(temp)
        }
    }

    const goTranslate = () => {
        setTrGlobal({ isTransed: true })
        testCharGpt()
    }


    // -------------------------------------------------------------------------------------------
    // 当前执行状态
    const [nowTransIndex, setNowTransIndex] = useState(0)

    const chuli = async () => {
        const trTemp = _.cloneDeep(textRectLists.text_array)
        // 每个请求需要包含的翻译条数
        const transListCount = 20

        let temp: { id: any; label: any }[] = []
        // 组装数据
        let tempNum = 0
        for (let i = nowTransIndex; i < trTemp.length; i += 1) {
            setNowTransIndex(i)
            // 没有翻译的,或者翻译出来为空的
            if (trTemp[i].info.text !== '' && (trTemp[i].info.trans === '' || trTemp[i].info.transed === false)) {
                tempNum += 1
                temp.push({ id: trTemp[i].id, label: trTemp[i].info.text })
            }
            if (tempNum >= transListCount) {
                break
            }
            if (i === trTemp.length - 1) {
                setNowTransIndex(0)
            }
        }
        tempNum = 0

        // eslint-disable-next-line no-await-in-loop
        if (temp.length !== 0) {
            try {
                const res: any = await getGpt(temp);
                // 请求响应以后的处理
                res.forEach((element: any) => {
                    // eslint-disable-next-line no-param-reassign
                    trTemp.forEach((item: any) => {
                        if (element.id === item.id) {
                            // eslint-disable-next-line no-param-reassign
                            item.info.trans = element.label;
                            // eslint-disable-next-line no-param-reassign
                            item.info.transed = true;
                        }
                    });
                });
                setTextRectList(trTemp);
                setTrGlobal({ isTransed: true });
                temp = [];
            } catch (err) {
                console.log(err);
            }
        }
    }

    const ttt: any = useRef()

    useEffect(() => {
        // 重新注入数据
        ttt.current = chuli
        return () => { }
    }, [textRectLists.text_array])

    const testCharGpt = async () => {
        let isRuning = false
        // 定时创建定时器,间隔请求
        setInterval(async () => {
            // 定时检查新的数据
            if (!isRuning) {
                isRuning = true
                await ttt.current()

                // 每个请求必须的间隔
                window.setTimeout(() => {
                    isRuning = false
                }, 1000 * 6)
            }
        }, 1000 * 1)
    }



    const handleChange = ({ hex }: any) => {
        // setSelectColor({ color: hex });
        // onChange && onChange(hex);
        console.log(hex)
    };

    let t = 0

    const changeRectSize = (newValue: number) => {
        const bias = 100
        if (t) {
            clearTimeout(t)
        }
        // 添加整体偏移
        t = window.setTimeout(() => {

            let temp = _.cloneDeep(textRectLists.text_array)
            temp = temp.map((node: any, index: number) => {
                const templh = bias * (newValue - textRectOffset)
                const templw = bias * (newValue - textRectOffset)
                setTextRectOffset(newValue)

                const cccc = {
                    ...node,
                    lineTop: node.lineTop - templh,
                    lineHeight: node.lineHeight + templh * 2,
                    lineLeft: node.lineLeft - templw,
                    lineWidth: node.lineWidth + templw * 2,

                    rectTop: node.rectTop - templh,
                    rectHeight: node.rectHeight + templh * 2,
                    rectLeft: node.rectLeft - templw,
                    rectWidth: node.rectWidth + templw * 2,
                }
                if (index === 0) {
                    // console.log(cccc)
                }
                return cccc
            })
            setTextRectList(temp)
            setIsTrOk(true)
        }, 100)
    }


    const changeColor = (colorHex: any) => {
        // 修改所有元素颜色
        if (isSelectedAll) {
            let temp = _.cloneDeep(textRectLists.text_array)
            temp = temp.map((node: any) => {
                const cccc = {
                    ...node,
                    color: colorHex
                }
                return cccc
            })
            setTextRectList(temp)
        } else if (!isSelectedAll && selectedIndex >= 0) {
            setTextRectListModify({ color: colorHex })
        }
    }

    const changeFamily = (family: any) => {
        // 修改所有元素颜色
        if (isSelectedAll) {
            let temp = _.cloneDeep(textRectLists.text_array)
            temp = temp.map((node: any) => {
                const cccc = {
                    ...node,
                    family
                }
                return cccc
            })
            setTextRectList(temp)
        } else if (!isSelectedAll && selectedIndex >= 0) {
            setTextRectListModify({ family })
        }
    }


    return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div className="textEditor"
            onClick={(ev) => {
                ev.stopPropagation()
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: "center" }}>
                <Button
                    onClick={() => setIsSelectedAll(!isSelectedAll)}
                    icon={< AlignLeft />}
                    toolTip="全选"
                    style={{ border: 0, gap: 0, backgroundColor: isSelectedAll ? "rgba(199, 180, 10, 1)" : "rgba(199, 180, 10, 0)" }}
                />全选
            </div>


            <div style={{ display: 'flex', flexDirection: 'column', alignItems: "center" }}>
                <span>识别框放大</span>
                <Slider.Root className="SliderRoot" defaultValue={[1]} min={1} max={1.4} step={0.02} aria-label="识别框放大" value={[textRectOffset]}
                    onValueChange={(value: number[]) => {
                        changeRectSize(value[0])
                    }}>
                    <Slider.Track className="SliderTrack">
                        <Slider.Range className="SliderRange" />
                    </Slider.Track>
                    <Slider.Thumb className="SliderThumb" />
                </Slider.Root>
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: "center" }}>
                <Button
                    toolTip="识别文字"
                    onClick={() => {
                        drawTextRectMask()
                    }}
                    icon={<ViewfinderCircleIcon />}
                />
                识别文字
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: "center" }}>
                <Button
                    toolTip="一键去字"
                    onClick={() => {
                        drawTextRectMask()
                    }}
                    icon={<PaintBrushIcon />}
                />一键去字
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: "center" }}>
                <Button
                    icon={<PhotoIcon />}
                    style={{ border: 0, gap: 0 }}
                    disabled={isInpainting}
                    toolTip="一键翻译"
                    onClick={goTranslate}
                />一键翻译
                {
                    trGlobal.isTransed ? (
                        <div style={{ width: "100px" }}>
                            <Switch.Root className="SwitchRoot" id="airplane-mode" onCheckedChange={(val) => {
                                setTrGlobal({ showTrans: val })
                            }}>
                                <Switch.Thumb className="SwitchThumb" />
                            </Switch.Root>
                        </div>
                    ) : (
                        <></>
                    )
                }

            </div>

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: "center" }}>
                <Button
                    toolTip="绘制文字到图片"
                    onClick={() => {
                        isDrawTextClick()
                    }}
                    icon={<PaintBrushIcon />}
                />绘制文字到图片
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: "center" }}>

                <Button
                    toolTip="放大文字识别区域"
                    onClick={() => {
                        zoom(10)
                    }}
                    icon={<PlusIcon />}
                />放大文字识别区域
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: "center" }}>

                <Button
                    toolTip="缩小文字识别区域"
                    onClick={() => {
                        zoom(-10)
                    }}
                    icon={<MinusIcon />}
                />缩小文字识别区域
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: "center" }}>
                <span>文字大小</span>
                <Slider.Root className="SliderRoot" defaultValue={[20]} max={200} step={1} aria-label="文字大小" value={[nodeInfo?.size]} onValueChange={(value: number[]) => {
                    // console.log(value)
                    setTextRectListModify({ size: value[0] })
                }
                }>
                    <Slider.Track className="SliderTrack">
                        <Slider.Range className="SliderRange" />
                    </Slider.Track>
                    <Slider.Thumb className="SliderThumb" />
                </Slider.Root>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: "center" }}>
                <span>字间距</span>
                <Slider.Root className="SliderRoot" defaultValue={[0]} max={90} step={1} aria-label="字间距" onValueChange={(value: number[]) => {
                    setTextRectListModify({ space: value[0] })
                }}>
                    <Slider.Track className="SliderTrack">
                        <Slider.Range className="SliderRange" />
                    </Slider.Track>
                    <Slider.Thumb className="SliderThumb" />
                </Slider.Root>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: "center" }}>
                <span>行高</span>
                <Slider.Root className="SliderRoot" defaultValue={[10]} max={200} step={1} aria-label="行高" value={[nodeInfo?.height]} onValueChange={(value: number[]) => {
                    setTextRectListModify({ height: value[0] })
                }}>
                    <Slider.Track className="SliderTrack">
                        <Slider.Range className="SliderRange" />
                    </Slider.Track>
                    <Slider.Thumb className="SliderThumb" />
                </Slider.Root>
            </div>


            <div style={{ display: 'flex', flexDirection: 'column', alignItems: "center", margin: "10px 0px" }}>
                <span>字体</span>
                <Selector
                    width={180}
                    value={!isSelectedAll && selectedIndex >= 0 ? nodeInfo?.family : allFamily}
                    options={Object.values(wokao)}
                    onChange={val => {
                        changeFamily(val)
                        setAllFamily(val)
                    }}
                />
            </div>

            {
                selectedIndex >= 0 ? (
                    <div>
                        <textarea className='textArea' value={nodeInfo.info.text} onChange={(e) => {
                            setTextRectListModify({ info: { ...nodeInfo.info, text: e.target.value, transed: false } })
                        }} />
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: "center" }}>

                            <Button
                                toolTip="翻译"
                                onClick={() => {
                                    console.log("dddd")
                                }}
                                icon={<PhotoIcon />}
                            />翻译
                        </div>
                        <textarea className='textArea' value={nodeInfo.info.trans} onChange={(e) => {
                            setTextRectListModify({ info: { ...nodeInfo.info, trans: e.target.value } })
                        }} />


                    </div>
                ) :
                    (
                        <></>
                    )
            }


            {
                isSelectedAll || selectedIndex >= 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: "center" }}>
                        <Button
                            toolTip="颜色选择"
                            onClick={() => {
                                setIsShowColorPicker(!isShowColorPicker)
                            }}
                            icon={<PhotoIcon />}
                        />颜色选择
                        <div style={{ position: "absolute", right: "220px", zIndex: '100' }}>
                            {
                                isShowColorPicker ? (
                                    <ChromePicker
                                        color={!isSelectedAll && selectedIndex >= 0 ? nodeInfo?.color : allColor}
                                        onChange={
                                            (hexInfo: any) => {
                                                const rgba = `rgba(${hexInfo.rgb.r},${hexInfo.rgb.g},${hexInfo.rgb.b},${hexInfo.rgb.a})`
                                                changeColor(rgba)
                                                setAllColor(rgba)
                                            }
                                        }

                                    />
                                ) : <></>}
                        </div>
                    </div>
                ) : (<></>)
            }


        </div >)
}






export default TextEditor