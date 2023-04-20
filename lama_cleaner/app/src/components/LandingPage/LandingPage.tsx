import React from 'react'
import { useSetRecoilState } from 'recoil'
import { fileState } from '../../store/atoms/Atoms'
import FileSelect from '../FileSelect/FileSelect'

const LandingPage = () => {
    const setFile = useSetRecoilState(fileState)

    return (
        <div className="landing-page">
            <h1>
                图像修复 周大宝
            </h1>
            <h1>
                Image inpainting powered by 🦙

                <a href="https://github.com/saic-mdal/lama">LaMa</a>
            </h1>
            <div className="landing-file-selector">
                <FileSelect
                    onSelection={async f => {
                        setFile(f)
                    }}
                />
            </div>
        </div>
    )
}

export default LandingPage
