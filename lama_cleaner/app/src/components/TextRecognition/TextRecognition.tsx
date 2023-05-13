/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable react/jsx-boolean-value */
import React, { SyntheticEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import ContentEditable from 'react-contenteditable'
import _ from "lodash"
import { useRecoilState } from 'recoil';
import { useKeyPressEvent } from 'react-use'

import {
    textRectList, textRectListHidden, isShowState, selectedIndexState,
    trGlobalState, drawClick, rePcsTextRectClick, textRectListModifyState,
    canvasOffsetState, ctrlStateAtom, textRectListUndoRedo
    , TextRect, fileState, globalContext, isPanningState,
    imageWidthState, imageHeightState, rendersState
} from '../../store';

import { mouseXY, getGpt, cutImageSizeFile, blobToImg, cutImageSize, dataURItoBlob } from '../../utils'

import { textInpaint } from '../../adapters/inpainting'

import useHotKey from '../../hooks/useHotkey'
import emitter, { REVOCAT_INPAITINE } from '../../event'


// 当前组件插入在editor/editor下
const TextRecognition = () => {
    const [renders, setRenders] = useRecoilState(rendersState)

    const [textRects, setTextRectList] = useRecoilState(textRectList)
    const [, setTextRectListItemHidden] = useRecoilState(textRectListHidden)
    const [isShow, setIsShow] = useRecoilState(isShowState)
    const [context, setContext] = useRecoilState<CanvasRenderingContext2D | null>(globalContext)
    const [selectedIndex, setSelectedIndex] = useRecoilState(selectedIndexState)
    const [trGlobal, setTrGlobal] = useRecoilState(trGlobalState)
    const [isDrawClick, setDrawClick] = useRecoilState(drawClick)
    const [isPcsTextRectClick, setPcsTextRectClick] = useRecoilState(rePcsTextRectClick)
    const [textRectListModify, setTextRectListModify] = useRecoilState(textRectListModifyState)
    const [canvasOffset, setCanvasOffset] = useRecoilState(canvasOffsetState)
    const [ctrlState, setCtrlState] = useRecoilState(ctrlStateAtom)
    const [rectLTinfo, setRectLTinfo] = useState<{
        x: number,
        y: number
    }>({ x: 0, y: 0 })

    const [rectRBinfo, setRectRBinfo] = useState<{
        x: number,
        y: number
    }>({ x: 0, y: 0 })
    const [isShowRect, setIsShowRect] = useState<boolean>(false)
    const [imageWidth, setImageWidth] = useRecoilState(imageWidthState)
    const [imageHeight, setImageHeight] = useRecoilState(imageHeightState)
    const [isPanning, setPanning] = useRecoilState(isPanningState)

    const [isCtrlPressed, setCtrlPressed] = useState<boolean>(false)

    const offsetHeight = parseInt(`${process.env.REACT_APP_OFFSET_HEIGHT}`, 10)
    const offsetWidth = parseInt(`${process.env.REACT_APP_OFFSET_WIDTH}`, 10)

    const onTRMouseDown = (ev: SyntheticEvent) => {
        // 开始画坐标
        if (!isPanning && !isCtrlPressed) {
            const xy = mouseXY(ev)
            setRectLTinfo({ x: xy.x, y: xy.y })
            setRectRBinfo({ x: xy.x, y: xy.y })
            setIsShowRect(true)
        }
    }
    const onTRMouseDrag = (ev: SyntheticEvent) => {
        if (!isPanning && !isCtrlPressed) {
            const xy = mouseXY(ev)
            if (xy.x < 0 || xy.y < 0) return
            if (isShowRect) {
                setRectRBinfo({ x: xy.x, y: xy.y })
            }
        }
    }

    const onTRMouseUp = useCallback((ev: SyntheticEvent) => {
        // 分页高度,这个数值是从服务端获取到的
        if (isShowRect && !isPanning && !isCtrlPressed) {
            const trSpliceHeight = 1800
            const xy = mouseXY(ev)
            setRectRBinfo({ x: xy.x, y: xy.y })
            // 节流,画的框框太小就什么都不做
            if (Math.abs(rectLTinfo.x - xy.x) > 30 && Math.abs(rectLTinfo.y - xy.y) > 30) {
                // 节流,画的框框太小就什么都不做
                const rect = [[rectLTinfo.x, rectLTinfo.y], [rectRBinfo.x, rectRBinfo.y]]
                const pn = rectLTinfo.y / trSpliceHeight
                let rectLeft = 0
                let rectTop = 0
                if (rectLTinfo.x >= rectRBinfo.x) {
                    rectLeft = rectRBinfo.x
                } else {
                    rectLeft = rectLTinfo.x
                }
                if (rectLTinfo.y >= rectRBinfo.y) {
                    rectTop = rectRBinfo.y
                } else {
                    rectTop = rectLTinfo.y
                }
                const rectWidth = Math.abs(rectLTinfo.x - rectRBinfo.x)
                const rectHeight = Math.abs(rectLTinfo.y - rectRBinfo.y)

                const lineTop = rectTop + offsetHeight
                const lineLeft = rectLeft + offsetWidth
                const lineWidth = rectWidth - 2 * offsetWidth
                const lineHeight = rectHeight - 2 * offsetHeight

                const tt: TextRect = {
                    rect,
                    lineTop,
                    lineLeft,
                    lineHeight,
                    lineWidth,
                    rectTop,
                    rectHeight,
                    rectLeft,
                    rectWidth,
                    id: Math.ceil(Math.random() * 100000),
                    pn,
                    size: lineHeight,
                    height: lineHeight,
                    color: "black",
                    info: { text: '', trans: '', cfd: "", transed: false },
                    heightOffset: 0,
                    align: null,
                    family: null,
                    space: 0
                }

                // 保存新数据
                const tempTextRects = _.cloneDeep(textRects)
                tempTextRects.text_array.push(tt)
                setTextRectList(tempTextRects.text_array)
            } else {
                setRectLTinfo({ x: 0, y: 0 })
                setRectRBinfo({ x: 0, y: 0 })
            }
            setIsShowRect(false)
        }
    }, [textRects, rectLTinfo, rectRBinfo, isCtrlPressed])

    const getRectInfo = useCallback(() => {
        let left = 0;
        let top = 0;
        let width = 0;
        let height = 0;

        if (rectLTinfo.x >= rectRBinfo.x) {
            left = rectRBinfo.x
        } else {
            left = rectLTinfo.x
        }

        if (rectLTinfo.y >= rectRBinfo.y) {
            top = rectRBinfo.y
        } else {
            top = rectLTinfo.y
        }

        width = Math.abs(rectLTinfo.x - rectRBinfo.x)
        height = Math.abs(rectLTinfo.y - rectRBinfo.y)
        return { left, top, width, height }
    }, [rectLTinfo, rectRBinfo])


    // 删除一个识别区域
    const removeTextRect = async (removeIndex: number) => {
        console.log('remove rect ', removeIndex)
        const tempTextRects = _.cloneDeep(textRects)

        // 重新绘制区域
        const left = tempTextRects.text_array[removeIndex].rectLeft
        const top = tempTextRects.text_array[removeIndex].rectTop
        const width = tempTextRects.text_array[removeIndex].rectWidth
        const height = tempTextRects.text_array[removeIndex].rectHeight

        // 从原始图片上截取信息
        const cutFile = cutImageSize(renders[0], imageWidth, imageHeight, left, top, width, height)
        const promiseImage = await blobToImg(cutFile.file)
        // 绘图
        const ctx = context
        if (ctx) {
            // 更新当前redner 
            ctx.drawImage(promiseImage, left, top)
            // const dl = ctx.canvas.toDataURL()
            // const blobn = dataURItoBlob(dl)
            // console.log(URL.createObjectURL(blobn))
            // const image = await blobToImg(blobn)

            // const prevRenders = renders.slice(0, -1)
            // prevRenders[prevRenders.length - 1] = image
            // setRenders(prevRenders)

            // 删除识别框
            tempTextRects.text_array.splice(removeIndex, 1)
            setSelectedIndex(-1)
            setTextRectList(tempTextRects.text_array)
        } else {
            console.log("更新renders失败")
        }
    }


    // 重新识别并绘制
    const rePcsTextRect = (rePcsIndex: number) => {
        isPcsTextRectClick(rePcsIndex)
        emitter.emit(REVOCAT_INPAITINE, rePcsIndex)
    }

    // 方向键移动位置,ctrl+左右,缩放高度,ctrl+上下,缩放宽度

    useHotKey(
        'del',
        () => {
            if (selectedIndex < 0) return
            removeTextRect(selectedIndex)
        },
        {},
        [textRectListModify, selectedIndex]
    )



    useHotKey(
        'ctrl+right',
        () => {
            if (selectedIndex < 0) return
            setTextRectListModify({
                lineLeft: textRectListModify.lineLeft - 1,
                rectLeft: textRectListModify.rectLeft - 1,
                lineWidth: textRectListModify.lineWidth + 2,
                rectWidth: textRectListModify.rectWidth + 2,
            })
        },
        {},
        [textRectListModify, selectedIndex]
    )

    useHotKey(
        'ctrl+left',
        () => {
            if (selectedIndex < 0) return
            setTextRectListModify({
                lineLeft: textRectListModify.lineLeft + 1,
                rectLeft: textRectListModify.rectLeft + 1,
                lineWidth: textRectListModify.lineWidth - 2,
                rectWidth: textRectListModify.rectWidth - 2,
            })
        },
        {},
        [textRectListModify, selectedIndex]
    )


    useHotKey(
        'ctrl+up',
        () => {
            if (selectedIndex < 0) return
            setTextRectListModify({
                lineTop: textRectListModify.lineTop - 1,
                rectTop: textRectListModify.rectTop - 1,
                lineHeight: textRectListModify.lineHeight + 2,
                rectHeight: textRectListModify.rectHeight + 2,
                height: textRectListModify.lineHeight + 2,
                size: textRectListModify.lineHeight + 2
            })
        },
        {},
        [textRectListModify, selectedIndex]
    )

    useHotKey(
        'ctrl+down',
        () => {
            if (selectedIndex < 0) return
            setTextRectListModify({
                lineTop: textRectListModify.lineTop + 1,
                rectTop: textRectListModify.rectTop + 1,
                lineHeight: textRectListModify.lineHeight - 2,
                rectHeight: textRectListModify.rectHeight - 2,
                height: textRectListModify.lineHeight - 2,
                size: textRectListModify.lineHeight - 2

            })
        },
        {},
        [textRectListModify, selectedIndex]
    )

    useHotKey(
        'left',
        () => {
            if (selectedIndex < 0) return
            setTextRectListModify({ lineLeft: textRectListModify.lineLeft - 1, rectLeft: textRectListModify.rectLeft - 1 })
        },
        {},
        [textRectListModify, selectedIndex]
    )

    useHotKey(
        'right',
        () => {
            if (selectedIndex < 0) return
            setTextRectListModify({ lineLeft: textRectListModify.lineLeft + 1, rectLeft: textRectListModify.rectLeft + 1 })
        },
        {},
        [textRectListModify, selectedIndex]
    )

    useHotKey(
        'up',
        () => {
            if (selectedIndex < 0) return
            setTextRectListModify({ lineTop: textRectListModify.lineTop - 1, rectTop: textRectListModify.rectTop - 1 })
        },
        {},
        [textRectListModify, selectedIndex]
    )

    useHotKey(
        'down',
        () => {
            if (selectedIndex < 0) return
            setTextRectListModify({ lineTop: textRectListModify.lineTop + 1, rectTop: textRectListModify.rectTop + 1 })
        },
        {},
        [textRectListModify, selectedIndex]
    )



    // const trRefs = Array(textRects.text_array.length)
    //     .fill('')
    //     .map((_, index) => index)

    // // eslint-disable-next-line react-hooks/rules-of-hooks
    // const Refs = trRefs.map(() => useRef(null))

    const onChange = (index: number | undefined) => {
        if (index) {
            // const html = Refs[index].current;
            // console.log(html)
        }
    }


    const handleChange = (evt: any) => {
        console.log(evt)
    }


    useKeyPressEvent(
        'Control',
        () => {
            setCtrlPressed(true)
        },
        () => {
            setCtrlPressed(false)
        }
    )

    const onRectMouseDown = (nowIndex: number) => {
        console.log(textRects.text_array[nowIndex])
        setSelectedIndex(nowIndex)
    }

    const onRectMouseMove = useCallback((ev: SyntheticEvent) => {
        if (isCtrlPressed && selectedIndex >= 0) {
            const mouseEvent = ev.nativeEvent as MouseEvent
            const temp = _.cloneDeep(textRects.text_array)
            const tempRect = temp[selectedIndex]
            tempRect.lineLeft = (mouseEvent.clientX - canvasOffset.positionX) / canvasOffset.scale - tempRect.lineWidth / 2
            tempRect.lineTop = (mouseEvent.clientY - canvasOffset.positionY) / canvasOffset.scale - tempRect.lineHeight / 2
            tempRect.rectLeft = tempRect.lineLeft - offsetWidth
            tempRect.rectTop = tempRect.lineTop - offsetHeight
            setTextRectList(temp)
        }
    }, [isCtrlPressed, selectedIndex, canvasOffset])

    const onRectMouseUp = () => {
        console.log("pressed release")
    }



    return (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div className="textRectContainer"
            onMouseDown={onTRMouseDown}
            onMouseMove={onTRMouseDrag}
            onMouseUp={onTRMouseUp}
            style={{ display: isShow ? "block" : 'none' }}>

            {isShowRect ? (
                <div className='huitu' style={{ ...getRectInfo(), pointerEvents: 'none', position: "absolute", border: "1px solid red" }} />
            ) : <></>}

            {
                textRects.text_array.map((item: any, Index: number) => (
                    <React.Fragment key={`frag_${item.id}`}>
                        <div className='textRect'
                            style={{
                                top: `${item.rectTop}px`, left: `${item.rectLeft}px`,
                                width: `${item.rectWidth}px`, height: `${item.rectHeight}px`,
                                border: '1px solid blue',
                            }}
                            aria-hidden="true"
                            key={`textRect_${item.id}`}>
                            <div className='closeArea' style={{ left: `${item.rectWidth}px` }}
                                key={`closeArea_${item.id}`}
                                onMouseDown={ev => ev.stopPropagation()}
                                onMouseUp={ev => ev.stopPropagation()}
                                onClick={(ev: SyntheticEvent) => {
                                    ev.stopPropagation()
                                    ev.preventDefault()
                                    removeTextRect(Index)
                                }}>X</div>
                            <div className='rePcsArea' aria-hidden="true"
                                key={`rePcsArea_${item.id}`}
                                style={{ left: `${item.rectWidth}px` }}
                                onClick={(ev: SyntheticEvent) => {
                                    ev.stopPropagation()
                                    ev.preventDefault()
                                    rePcsTextRect(Index)
                                }}>重做</div>
                        </div>

                        <div
                            style={{
                                position: "absolute",
                                top: `${item.lineTop}px`,
                                left: `${item.lineLeft}px`,
                                height: `${item.lineHeight}px`,
                                width: `${item.lineWidth}px`,
                                lineHeight: `${item.height}px`,
                                border: "1px solid red",
                                color: `${item.color}`,
                                fontSize: `${item.size}px`,
                                letterSpacing: `${item.space}px`,
                                fontFamily: `${item.family}`,
                                whiteSpace: 'pre',
                                visibility: textRects.Undo_Index.includes(Index) ? 'hidden' : 'visible',
                            }}
                            key={`textInfo_${item.id}`}
                            className='textInfo'
                            aria-hidden="true"

                            // 写法参考https://en.leezx.cn/posts/2021/08/30/_0830-how-to-use-multiple-refs-for-an-array-of-elements.html
                            // ref={Refs[Index]}
                            onMouseDown={
                                ev => {
                                    ev.stopPropagation()
                                    onRectMouseDown(Index)
                                }
                            }
                            onMouseMove={
                                ev => {
                                    ev.stopPropagation()
                                    onRectMouseMove(ev)
                                }
                            }
                            onMouseUp={
                                ev => {
                                    ev.stopPropagation()
                                    ev.preventDefault()
                                    onRectMouseUp()
                                }
                            }
                            onClick={ev => { ev.stopPropagation() }}
                        >
                            <span style={{
                                verticalAlign: 'top',
                                lineHeight: `${item.height}px`
                            }}> {trGlobal.showTrans ? item.info.trans : item.info.text}</span>

                        </div >
                    </React.Fragment>
                ))
            }
        </div >
    )
}


export default TextRecognition