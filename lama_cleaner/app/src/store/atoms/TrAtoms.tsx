/* eslint-disable camelcase */

import { atom, selector } from 'recoil'
import _ from 'lodash'
import App from '../../App'


interface Rectinfo {
    text: string,
    cfd: string,
    trans: string,
}

export interface TextRect {
    id: number,
    // 当前数据属于大图的哪个区块
    pn: number,
    rect: number[][],
    info: Rectinfo,
    top: number,
    left: number,
    // 行高,绘制文字用,
    lineHeight: number,
    // 识别区域高,
    rectHeight: number,
    // 高度偏移
    heightOffset: number
    // 宽度
    width: number,
    // 对齐方式
    align: string,
    // 文字大小
    size: number,
    // 颜色
    color: string,
    // 字体
    family: string
    // 间距
    space: number,


}

export interface TextRectListState {
    text_array: TextRect[],
    Undo_Index: number[],
    Redo_Index: number[],
    splice_height: number,
    isTring: boolean,
    isTrOk: boolean,
    isShow: boolean,
    selectedIndex: number,
    isShowColorPicker: boolean,
    isCtrl: boolean,
    isDrawing: object,
    showTans: boolean
}

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
        selectedIndex: -1,
        isShowColorPicker: false,
        isCtrl: false,
        isDrawing: {},
        showTans: false,
    }
})

export const drawClick = atom<any>({
    key: 'drawClick',
    default: undefined,
})


export const drawTextClick = atom<any>({
    key: 'drawTextClick',
    default: undefined,
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


// ctrl是否按下
export const trGlobalState = selector({
    key: 'trGlobalState',
    get: ({ get }) => {
        const app = get(textRectListState)
        return app
    },
    set: ({ get, set }, stateInfo: any) => {
        const app = get(textRectListState)
        const temp: { [index: string]: any } = _.cloneDeep(app)
        Object.keys(stateInfo).forEach((element: string) => {
            temp[element] = stateInfo[element]
        });
        set(textRectListState, { ...app, ...temp })
    },
})


// undo redo 文本识别数据
export const textRectListUndoRedo = selector({
    key: 'textRectListUndoRedo',
    get: ({ get }) => {
        const app = get(textRectListState)
        return {
            un: app.Undo_Index,
            re: app.Redo_Index
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



// 打开颜色选择器
export const showColorPickerState = selector({
    key: 'showColorPickerState',
    get: ({ get }) => {
        const app = get(textRectListState)
        return app.isShowColorPicker

    },
    set: ({ get, set }, newValue: any) => {
        const app = get(textRectListState)
        set(textRectListState, { ...app, isShowColorPicker: !newValue })
    },
})


// 修改文本识别框位置,,或者取名叫修改所选元素的相关属性
export const textRectListModifyState = selector({
    key: 'textRectListModifyState',
    get: ({ get }) => {
        const app = get(textRectListState)
        if (app.selectedIndex > 0) {
            return app.text_array[app.selectedIndex]
        }
    },
    set: ({ get, set }, nodeInfo: any) => {
        // nodeInfo:{}
        const app = get(textRectListState)
        if (app.selectedIndex > 0) {
            // 给-1,就是撤销,其他的就是重做
            const { text_array } = app
            const temp = _.cloneDeep(text_array)
            const t: { [key: string]: any } = temp[app.selectedIndex]
            Object.keys(nodeInfo).forEach(element => {
                t[element] = nodeInfo[element]
            });
            set(textRectListState, { ...app, text_array: temp })
        }
    },
})

// 修改数据
export const selectedIndexState = selector({
    key: 'selectedIndexState',
    get: ({ get }) => {
        const app = get(textRectListState)
        return app.selectedIndex
    },
    set: ({ get, set }, selectedIndex: any) => {
        const app = get(textRectListState)
        set(textRectListState, { ...app, selectedIndex })
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