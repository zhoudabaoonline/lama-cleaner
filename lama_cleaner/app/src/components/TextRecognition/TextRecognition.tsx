import React, { useRef } from 'react';
import { useRecoilState } from 'recoil';
import { textRectList, textRectListHidden, isShowState } from '../../store';

// 当前组件插入在editor/editor下
const TextRecognition = () => {
    const [textRects, setTextRectListState] = useRecoilState(textRectList)
    const [, setTextRectListItemHidden] = useRecoilState(textRectListHidden)
    const [isShow, setIsShow] = useRecoilState(isShowState)

    const removeTextRect = (hiddenIndex: number) => {
        setTextRectListItemHidden(hiddenIndex)
    }
    const selectedIndex = useRef(-1)

    const selected = (index: number) => {
        console.log("d")
        selectedIndex.current = index
    }


    const trRefs = Array(10)
        .fill('')
        .map((_, index) => index)

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const Refs = trRefs.map(() => useRef(null))

    const onChange = (index: number | undefined) => {
        if (index) {
            const html = Refs[index].current;
            console.log(html)
        }
    }


    console.log(isShow)
    return (
        <div className="textRectContainer" style={{ display: isShow ? "block" : 'none' }}>
            {
                textRects.text_array.map((item: any, Index: number) => (
                    <div className='textRect'
                        style={{
                            top: `${item.top}px`, left: `${item.left}px`,
                            visibility: textRects.Undo_Index.includes(Index) ? 'hidden' : 'visible',
                        }}
                        onClick={() => selected(Index)} aria-hidden="true"
                        key={`textRegonition${item.id}`}>
                        <div
                            className='textRegonition'
                            aria-hidden="true"
                            style={{
                                height: `${item.height}px`, width: `${item.width}px`,
                                fontSize: `${item.height - 4}px`, lineHeight: `${item.height - 2}px`, textAlign: "center",
                                border: selectedIndex.current === Index ? '1px solid red' : '1px solid blue'
                            }}
                        >
                            <div className='closeArea' aria-hidden="true" style={{ left: `${item.width}px` }} onClick={() => removeTextRect(Index)}>X</div>
                            <div
                                key={`text${item.id}`}
                                className='text'
                                // 写法参考https://en.leezx.cn/posts/2021/08/30/_0830-how-to-use-multiple-refs-for-an-array-of-elements.html
                                ref={Refs[Index]}
                                contentEditable="true"
                                onInput={() => onChange(Index)}
                                onBlur={() => onChange(Index)}
                                suppressContentEditableWarning
                            >{item.info.text}</div>
                        </div>
                        <div className='editArea' style={{ visibility: selectedIndex.current === Index ? 'visible' : 'hidden' }}>
                            <div>选择字体</div>
                            <div>选择大小</div>
                            <div>排版</div>
                        </div>
                    </div>
                ))
            }
        </div >
    )
}


export default TextRecognition