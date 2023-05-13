import 'hacktimer'
import React from 'react'
import ReactDOM from 'react-dom'
import './styles/_index.scss'
// https://recoiljs.org/,一个react的状态管理库
import { RecoilRoot } from 'recoil'
import App from './App'

ReactDOM.render(
    <RecoilRoot>
        <App />
    </RecoilRoot>
    ,
    document.getElementById('root')
)
