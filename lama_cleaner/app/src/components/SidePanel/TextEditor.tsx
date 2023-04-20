import { FolderIcon } from '@heroicons/react/24/outline'
import React from 'react'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { isShowState, isDrawingState, isTrOkState, toastState, drawClick } from "../../store"
import Button from '../shared/Button'

interface TextEditorProps {
    onClick: () => void
}

const TextEditor: React.FC<TextEditorProps> = (props) => {

    const { onClick } = props

    const setToastState = useSetRecoilState(toastState)
    const [isDrawing, setIsDrawing] = useRecoilState(isDrawingState)
    const [isTrOk, setIsTrOk] = useRecoilState(isTrOkState)
    const [isDrawClick, setDrawClick] = useRecoilState(drawClick)


    const drawTextRectMask = () => {
        if (isTrOk) {
            // 注意这里的写法
            onClick?.()
        } else {
            setToastState({
                open: true,
                desc: "请先识别图片上的文字数据",
                state: 'error',
                duration: 4000,
            })
        }
    }


    return (<div className="textEditor">
        <Button
            toolTip="绘制文字识别区域蒙版"
            onClick={() => {
                drawTextRectMask()
            }}
            icon={<FolderIcon />}
        />




        sdfsdf
    </div >)
}

export default TextEditor