
import { atom, selector } from 'recoil'
import _ from 'lodash'


interface Rectinfo {
    text: string,
    cfd: string,
}

export interface TextRect {
    id: number,
    // 当前数据属于大图的哪个区块
    pn: number,
    rect: number[][],
    info: Rectinfo,
    top: number,
    left: number,
    height: number,
    width: number,
}

export interface TextRectListState {
    text_array: TextRect[],
    Undo_Index: number[],
    Redo_Index: number[],
    splice_height: number,
    isTring: boolean,
    isTrOk: boolean,
    isShow: boolean,
    isDrawing: object,
}

export const drawClick = atom<any>({
    key: 'drawClick',
    default: undefined,
})

export const textRectListState = atom<TextRectListState>({
    key: "textRectListState",
    default: {
        text_array: [],
        Undo_Index: [],
        Redo_Index: [],
        splice_height: 2000,
        isTring: false,
        isTrOk: false,
        isShow: false,
        isDrawing: {},
    }
})


// 设置文本识别数据
export const textRectList = selector({
    key: 'textRectList',
    get: ({ get }) => {
        const app = get(textRectListState)
        return app
    },
    set: ({ get, set }, newValue: any) => {
        const app = get(textRectListState)
        set(textRectListState, { ...app, text_array: newValue })
    },
})


// undo redo 文本识别数据
export const textRectListUndoRedo = selector({
    key: 'textRectListUndoRedo',
    get: ({ get }) => {
        const app = get(textRectListState)
        return {
            un: app.Undo_Index.length > 0,
            re: app.Redo_Index.length > 0
        }
    },
    set: ({ get, set }, UnOrRe: any) => {
        const app = get(textRectListState)
        // 给-1,就是撤销,其他的就是重做
        const tempUndo = [...app.Undo_Index]
        const tempRedo = [...app.Redo_Index]
        if (UnOrRe < 0) {
            const onePop = tempUndo.pop()
            if (onePop) {
                tempRedo.push(onePop)
                set(textRectListState, { ...app, Undo_Index: tempUndo, Redo_Index: tempRedo })
            }
        } else {
            const redoIndex = tempRedo.pop()
            if (redoIndex) {
                tempUndo.push(redoIndex)
                set(textRectListState, { ...app, Undo_Index: tempUndo, Redo_Index: tempRedo })
            }
        }
    },
})

// 隐藏一个识别数据
export const textRectListHidden = selector({
    key: 'textRectListHidden',
    get: ({ get }) => {
        const app = get(textRectListState)
        return {
            un: app.Undo_Index.length > 0,
            re: app.Redo_Index.length > 0
        }
    },
    set: ({ get, set }, hiddenIndex: any) => {
        console.log(hiddenIndex)
        const app = get(textRectListState)
        const temp = [...app.Undo_Index]
        temp.push(hiddenIndex)
        set(textRectListState, { ...app, Undo_Index: temp, Redo_Index: [] })
    },
})


// 文字是否识别中
export const isTringState = selector({
    key: 'isTring',
    get: ({ get }) => {
        const app = get(textRectListState)
        return app.isTring
    },
    set: ({ get, set }, newValue: any) => {
        const app = get(textRectListState)
        set(textRectListState, { ...app, isTring: newValue })
    },
})


// 文字识别是否已经完成
export const isTrOkState = selector({
    key: 'isTrOk',
    get: ({ get }) => {
        const app = get(textRectListState)
        return app.isTrOk
    },
    set: ({ get, set }, newValue: any) => {
        const app = get(textRectListState)
        set(textRectListState, { ...app, isTrOk: newValue })
    },
})


// 文字识别信息是否在最前展示
export const isShowState = selector({
    key: 'isShow',
    get: ({ get }) => {
        const app = get(textRectListState)
        return app.isShow
    },
    set: ({ get, set }, newValue: any) => {
        const app = get(textRectListState)
        set(textRectListState, { ...app, isShow: newValue })
    },
})

// 是否绘制文字识别区域到蒙版
export const isDrawingState = selector({
    key: 'isDrawing',
    get: ({ get }) => {
        const app = get(textRectListState)
        return app.isDrawing
    },
    set: ({ get, set }, newValue: any) => {
        const app = get(textRectListState)
        set(textRectListState, { ...app, isDrawing: newValue })
    },
})