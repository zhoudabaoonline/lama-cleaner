import React, { ReactNode } from 'react'
import { useRecoilState } from 'recoil'
import { shortcutsState } from '../../store/atoms/Atoms'
import Modal from '../shared/Modal'

interface Shortcut {
    content: string
    keys: string[]
}

function ShortCut(props: Shortcut) {
    const { content, keys } = props

    return (
        <div className="shortcut-option">
            <div className="shortcut-description">{content}</div>
            <div style={{ display: 'flex', justifySelf: 'end', gap: '8px' }}>
                {keys.map((k, index) => (
                    <div className="shortcut-key" key={k}>
                        {k}
                    </div>
                ))}
            </div>
        </div>
    )
}

const isMac = (function () {
    return /macintosh|mac os x/i.test(navigator.userAgent)
})()

const isWindows = (function () {
    return /windows|win32/i.test(navigator.userAgent)
})()

const CmdOrCtrl = isMac ? 'Cmd' : 'Ctrl'

export default function ShortcutsModal() {
    const [shortcutsShow, setShortcutState] = useRecoilState(shortcutsState)

    const shortcutStateHandler = () => {
        setShortcutState(false)
    }

    return (
        <Modal
            onClose={shortcutStateHandler}
            title="快捷键"
            className="modal-shortcuts"
            show={shortcutsShow}
        >
            <div className="shortcut-options">
                <div className="shortcut-options-column">
                    <ShortCut content="面板" keys={['空格 + 拖动']} />
                    <ShortCut content="重置缩放面板" keys={['Esc']} />
                    <ShortCut content="减少笔刷尺寸" keys={['[']} />
                    <ShortCut content="增加笔刷尺寸" keys={[']']} />
                    <ShortCut content="查看源图" keys={['按住 Tab']} />
                    <ShortCut
                        content="多线条绘制"
                        keys={[`按住 ${CmdOrCtrl}`]}
                    />
                    <ShortCut content="终止绘图" keys={['Esc']} />
                </div>

                <div className="shortcut-options-column">
                    <ShortCut content="重跑最后的蒙版" keys={['R']} />
                    <ShortCut content="撤销" keys={[CmdOrCtrl, 'Z']} />
                    <ShortCut content="重做" keys={[CmdOrCtrl, 'Shift', 'Z']} />
                    <ShortCut content="复制结果" keys={[CmdOrCtrl, 'C']} />
                    <ShortCut content="粘贴图像" keys={[CmdOrCtrl, 'V']} />
                    <ShortCut
                        content="触发手动修图"
                        keys={['Shift', 'R']}
                    />
                    <ShortCut content="Trigger Interactive Segmentation" keys={['I']} />
                </div>

                <div className="shortcut-options-column">
                    <ShortCut content="选择主题" keys={['Shift', 'D']} />
                    <ShortCut content="打开快捷键对话框" keys={['H']} />
                    <ShortCut content="打开设置对话框" keys={['S']} />
                    <ShortCut content="打开文件管理器" keys={['F']} />
                </div>
            </div>
        </Modal>
    )
}
