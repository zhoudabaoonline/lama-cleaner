/* eslint-disable import/no-extraneous-dependencies */
import { FolderIcon, PlusIcon, MinusIcon, ViewfinderCircleIcon, PaintBrushIcon, PhotoIcon } from '@heroicons/react/24/outline'
import React from 'react'
import _ from "lodash"

import * as Select from '@radix-ui/react-select';
import * as Slider from '@radix-ui/react-slider'
import classnames from 'classnames';

import ChromePicker from 'react-color'

import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from '@radix-ui/react-icons'

import { useRecoilState, useSetRecoilState } from 'recoil'

import Selector from '../shared/Selector'


import {
    isShowState, isDrawingState, isTrOkState, toastState, drawClick
    , drawTextClick, textRectListModifyState, selectedIndexState, showColorPickerState, trGlobalState
} from "../../store"
import Button from '../shared/Button'


const MIN_FONT_SIZE = 10
const MAX_FONT_SIZE = 100


const TextEditor = () => {


    const setToastState = useSetRecoilState(toastState)
    const [isDrawing, setIsDrawing] = useRecoilState(isDrawingState)
    const [isTrOk, setIsTrOk] = useRecoilState(isTrOkState)

    const [isShow, setIsShow] = useRecoilState(isShowState)
    const [isDrawClick, setDrawClick] = useRecoilState(drawClick)
    const [nodeInfo, setTextRectListModify] = useRecoilState(textRectListModifyState)
    const [selectedIndex, setSelectedIndex] = useRecoilState(selectedIndexState)
    const [isShowColorPicker, setIsShowColorPicker] = useRecoilState(showColorPickerState)
    const [trGlobal, setTrGlobal] = useRecoilState(trGlobalState)
    const [isDrawTextClick, setDrawTextClick] = useRecoilState(drawTextClick)


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
        SansSerif = 'sans-serif'
    }



    const zoom = (percent: number) => {
        if (isShow && selectedIndex > 0) {
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

    const handleChange = ({ hex }: any) => {
        // setSelectColor({ color: hex });
        // onChange && onChange(hex);
        console.log(hex)
    };

    return (
        <div className="textEditor">
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
                    toolTip="绘制文字识别区域蒙版"
                    onClick={() => {
                        drawTextRectMask()
                    }}
                    icon={<PaintBrushIcon />}
                />绘制文字识别区域蒙版
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
                <Slider.Root className="SliderRoot" defaultValue={[10]} max={70} step={1} aria-label="文字大小" onValueChange={(value: number[]) => {
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
                <Slider.Root className="SliderRoot" defaultValue={[0]} max={30} step={1} aria-label="字间距" onValueChange={(value: number[]) => {
                    // console.log(value)
                    setTextRectListModify({ space: value[0] })
                }}>
                    <Slider.Track className="SliderTrack">
                        <Slider.Range className="SliderRange" />
                    </Slider.Track>
                    <Slider.Thumb className="SliderThumb" />
                </Slider.Root>
            </div>




            <div style={{ display: 'flex', flexDirection: 'column', alignItems: "center" }}>

                <Selector
                    width={80}
                    value={nodeInfo?.family}
                    options={Object.values(wokao)}
                    onChange={val => {
                        setTextRectListModify({ family: val })
                        console.log(val)
                    }}
                />



            </div>



            <div style={{ display: 'flex', flexDirection: 'row', alignItems: "center" }}>
                <Button
                    toolTip="颜色选择"
                    onClick={() => {
                        setIsShowColorPicker(isShowColorPicker)
                    }}
                    icon={<PhotoIcon />}
                />颜色选择
                <div style={{ position: "absolute", right: "220px", zIndex: '100' }}>
                    {
                        isShowColorPicker ? <ChromePicker color={nodeInfo?.color} onChange={
                            (hexInfo: any) => {
                                console.log(hexInfo.hex)
                                setTextRectListModify({ color: hexInfo.hex })
                            }
                        } onBlur={
                            console.log("shijiao")
                        } /> : <></>}
                </div>

            </div>

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: "center" }}>

                缩放文字间距
                <Button
                    toolTip="缩放文字间距"
                    onClick={() => {
                        setTextRectListModify({ space: nodeInfo.space + 1 })
                    }}
                    icon={<PlusIcon />}
                />
                <Button
                    toolTip="缩放文字间距"
                    onClick={() => {
                        setTextRectListModify({ space: nodeInfo.space - 1 })
                    }}
                    icon={<MinusIcon />}
                />
            </div>


        </div >)
}






export default TextEditor