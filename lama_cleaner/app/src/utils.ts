/* eslint-disable no-param-reassign */
import { SyntheticEvent, useEffect, useState } from 'react'
import _ from "lodash"
import { Line, TextRect } from './store'


const offsetHeight = parseInt(`${process.env.REACT_APP_OFFSET_HEIGHT}`, 10)
const offsetWidth = parseInt(`${process.env.REACT_APP_OFFSET_WIDTH}`, 10)


export const getTextRectCord = (item: any, trSpliceHeight: number) => {
    const [[x0, y0], [x1,], [, y2],] = [...item.rect]
    item.lineTop = y0 + trSpliceHeight * item.pn
    item.lineLeft = x0
    item.lineHeight = y2 - y0
    item.lineWidth = x1 - x0

    item.rectTop = item.lineTop - offsetHeight
    item.rectLeft = item.lineLeft - offsetWidth
    item.rectHeight = item.lineHeight + 2 * offsetHeight
    item.rectWidth = item.lineWidth + 2 * offsetWidth
    return item
}


export function dataURItoBlob(dataURI: string) {
    const mime = dataURI.split(',')[0].split(':')[1].split(';')[0]
    const binary = atob(dataURI.split(',')[1])
    const array = []
    for (let i = 0; i < binary.length; i += 1) {
        array.push(binary.charCodeAt(i))
    }
    return new Blob([new Uint8Array(array)], { type: mime })
}

// const dataURItoBlob = (dataURI: string) => {
//   const bytes =
//     dataURI.split(',')[0].indexOf('base64') >= 0
//       ? atob(dataURI.split(',')[1]) 
//       : unescape(dataURI.split(',')[1])
//   const mime = dataURI.split(',')[0].split(':')[1].split(';')[0]
//   const max = bytes.length
//   const ia = new Uint8Array(max)
//   for (var i = 0; i < max; i++) ia[i] = bytes.charCodeAt(i)
//   return new Blob([ia], { type: mime })
// }

export function downloadImage(uri: string, name: string) {
    const link = document.createElement('a')
    link.href = uri
    link.download = name

    // this is necessary as link.click() does not work on the latest firefox
    link.dispatchEvent(
        new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
        })
    )

    setTimeout(() => {
        // For Firefox it is necessary to delay revoking the ObjectURL
        // window.URL.revokeObjectURL(base64)
        link.remove()
    }, 100)
}

export function shareImage(base64: string, name: string) {
    const blob = dataURItoBlob(base64)
    const filesArray = [new File([blob], name, { type: 'image/jpeg' })]
    const shareData = {
        files: filesArray,
    }
    // eslint-disable-nextline
    const nav: any = navigator
    const canShare = nav.canShare && nav.canShare(shareData)
    const userAgent = navigator.userAgent || navigator.vendor
    const isMobile = /android|iPad|iPhone|iPod/i.test(userAgent)
    if (canShare && isMobile) {
        navigator.share(shareData)
        return true
    }
    return false
}


// blob转image;
export function blobToImg(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.addEventListener('load', () => {
            const img = new Image()
            if (reader.result) {
                img.src = reader.result?.toString()
                img.onload = () => resolve(img)
            }
        })
        reader.readAsDataURL(blob)
    })
}

// 加载处理完成的图片切片
export function loadImageSplice(image: HTMLImageElement, src: string) {
    console.log(src)
}

export function loadImage(image: HTMLImageElement, src: string) {
    return new Promise((resolve, reject) => {
        const initSRC = image.src
        const img = image
        img.onload = resolve
        img.onerror = err => {
            img.src = initSRC
            reject(err)
        }
        img.src = src
    })
}


// 返回初始图像
export function useImage(file?: File): [HTMLImageElement, boolean] {
    const [image] = useState(new Image())
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        if (file === undefined) {
            return
        }
        image.onload = () => {
            setIsLoaded(true)
        }
        setIsLoaded(false)
        image.src = URL.createObjectURL(file)
        return () => {
            image.onload = null
        }
    }, [file, image])

    return [image, isLoaded]
}

// https://stackoverflow.com/questions/23945494/use-html5-to-resize-an-image-before-upload
interface ResizeImageFileResult {
    file: File
    resized: boolean
    originalWidth?: number
    originalHeight?: number
}
export function resizeImageFile(
    file: File,
    maxSize: number
): Promise<ResizeImageFileResult> {
    const reader = new FileReader()
    const image = new Image()
    const canvas = document.createElement('canvas')

    const resize = (): ResizeImageFileResult => {
        let { width, height } = image

        if (width > height) {
            if (width > maxSize) {
                height *= maxSize / width
                width = maxSize
            }
        } else if (height > maxSize) {
            width *= maxSize / height
            height = maxSize
        }

        if (width === image.width && height === image.height) {
            return { file, resized: false }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            throw new Error('could not get context')
        }
        canvas.getContext('2d')?.drawImage(image, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg')
        const blob = dataURItoBlob(dataUrl)

        const f = new File([blob], file.name, {
            type: file.type,
        })
        return {
            file: f,
            resized: true,
            originalWidth: image.width,
            originalHeight: image.height,
        }
    }

    return new Promise((resolve, reject) => {
        if (!file.type.match(/image.*/)) {
            reject(new Error('Not an image'))
            return
        }
        reader.onload = (readerEvent: any) => {
            image.onload = () => resolve(resize())
            image.src = readerEvent.target.result
        }
        reader.readAsDataURL(file)
    })
}


interface CutFileResult {
    file: File
    resized: boolean
    originalWidth?: number
    originalHeight?: number
}

// 剪切图像文件
export function cutImageFile(
    file: File,
    originalWidth: number,
    originalHeight: number,
    pageNum: number,
    pageSize: number,

): Promise<CutFileResult> {
    const reader = new FileReader()
    const image = new Image()
    image.src = URL.createObjectURL(file)
    const canvas = document.createElement('canvas')

    const resize = (): CutFileResult => {

        const pn = Math.ceil(originalHeight / pageSize)
        let nowHeight = 0
        if (pageNum < pn) {
            nowHeight = pageSize
        } else if (pageNum === pn) {
            nowHeight = originalHeight - (pageNum - 1) * pageSize
        } else {
            nowHeight = 0
        }


        const offset = (pageNum - 1) * pageSize
        canvas.width = originalWidth
        canvas.height = nowHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            throw new Error('could not get context')
        }
        canvas.getContext('2d')?.drawImage(image, 0, -offset, originalWidth, originalHeight)
        const dataUrl = canvas.toDataURL('image/jpeg')
        const blob = dataURItoBlob(dataUrl)
        const f = new File([blob], file.name, {
            type: file.type,
        })
        return {
            file: f,
            resized: true,
            originalWidth: image.width,
            originalHeight: image.height,
        }
    }

    return new Promise((resolve, reject) => {
        if (!file.type.match(/image.*/)) {
            reject(new Error('Not an image'))
            return
        }
        reader.onload = (readerEvent: any) => {
            image.onload = () => resolve(resize())
            image.src = readerEvent.target.result
        }
        reader.readAsDataURL(file)
    })
}


// 剪切图像文件
export function cutImageSize(
    image: HTMLImageElement,
    originalWidth: number,
    originalHeight: number,
    left: number,
    top: number,
    width: number,
    height: number
): any {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
        throw new Error('could not get context')
    }
    canvas.getContext('2d')?.drawImage(image, -left, -top, originalWidth, originalHeight)
    const dataUrl = canvas.toDataURL('image/png')
    const blob = dataURItoBlob(dataUrl)

    return {
        file: blob,
        resized: true,
        originalWidth: image.width,
        originalHeight: image.height,
    }
}

// 剪切图像文件
export function cutImageSizeFile(
    file: File,
    originalWidth: number,
    originalHeight: number,
    left: number,
    top: number,
    width: number,
    height: number
): Promise<CutFileResult> {
    const reader = new FileReader()
    const image = new Image()
    image.src = URL.createObjectURL(file)
    const canvas = document.createElement('canvas')

    const resize = (): CutFileResult => {
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
            throw new Error('could not get context')
        }
        canvas.getContext('2d')?.drawImage(image, -left, -top, originalWidth, originalHeight)
        const dataUrl = canvas.toDataURL('image/png')
        const blob = dataURItoBlob(dataUrl)
        const f = new File([blob], file.name, {
            type: file.type,
        })
        return {
            file: f,
            resized: true,
            originalWidth: image.width,
            originalHeight: image.height,
        }
    }

    return new Promise((resolve, reject) => {
        if (!file.type.match(/image.*/)) {
            reject(new Error('Not an image'))
            return
        }
        reader.onload = (readerEvent: any) => {
            image.onload = () => resolve(resize())
            image.src = readerEvent.target.result
        }
        reader.readAsDataURL(file)
    })
}


export const getGpt = async (temp: { id: string, label: string }[]) => {

    return new Promise((resolve, reject) => {
        const req = JSON.stringify(temp)
        const promp = "请把下面的json字符串中属性名为label的值翻译成韩语"
        const t = JSON.stringify({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: promp + req }], temperature: 0.7 })
        console.log(`发送的请求内容:${t}`)
        try {
            fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer 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'
                },
                body: t,
            }).then(res => {
                // eslint-disable-next-line prefer-promise-reject-errors
                if (res.status !== 200) reject(new Error("请求太频繁"))
                return res.json()
            }).then(data => {
                console.log("返回的数据", data)
                const v = JSON.parse(data.choices[0].message.content)
                resolve(v)
            }).catch((err) => {
                console.log(err);
                reject(err)
            })
        } catch (e) {
            console.log("获取错误!!")
            reject(e)
        }
    })


}



export function mouseXY(ev: SyntheticEvent) {
    const mouseEvent = ev.nativeEvent as MouseEvent
    return { x: mouseEvent.offsetX, y: mouseEvent.offsetY }
}


export function keepGUIAlive() {
    async function getRequest(url = '') {
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-cache',
        })
        return response.json()
    }

    const keepAliveServer = () => {
        const url = document.location
        const route = '/flaskwebgui-keep-server-alive'
        getRequest(url + route).then(data => {
            return data
        })
    }

    const intervalRequest = 3 * 1000
    keepAliveServer()
    setInterval(keepAliveServer, intervalRequest)
}

export function isRightClick(ev: SyntheticEvent) {
    const mouseEvent = ev.nativeEvent as MouseEvent
    return mouseEvent.button === 2
}

export function isMidClick(ev: SyntheticEvent) {
    const mouseEvent = ev.nativeEvent as MouseEvent
    return mouseEvent.button === 1
}

export function srcToFile(src: string, fileName: string, mimeType: string) {
    return fetch(src)
        .then(function (res) {
            return res.arrayBuffer()
        })
        .then(function (buf) {
            return new File([buf], fileName, { type: mimeType })
        })
}

export async function askWritePermission() {
    try {
        // The clipboard-write permission is granted automatically to pages
        // when they are the active tab. So it's not required, but it's more safe.
        const { state } = await navigator.permissions.query({
            name: 'clipboard-write' as PermissionName,
        })
        return state === 'granted'
    } catch (error) {
        // Browser compatibility / Security error (ONLY HTTPS) ...
        return false
    }
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string): Promise<any> {
    return new Promise((resolve, reject) =>
        canvas.toBlob(async d => {
            if (d) {
                resolve(d)
            } else {
                reject(new Error('Expected toBlob() to be defined'))
            }
        }, mime)
    )
}

const setToClipboard = async (blob: any) => {
    const data = [new ClipboardItem({ [blob.type]: blob })]
    await navigator.clipboard.write(data)
}

export async function copyCanvasImage(canvas: HTMLCanvasElement) {
    const blob = await canvasToBlob(canvas, 'image/png')
    try {
        await setToClipboard(blob)
    } catch {
        console.log('Copy image failed!')
    }
}


export function getTextToLine(textRect: TextRect, offset = 0): Line {
    const brushSizes = textRect.rectHeight / 2
    // 去掉已经删除的
    const temp: { x: number, y: number }[] = []
    // 横坐标要减去半径,开始坐标
    temp.push({ x: textRect.rectLeft + brushSizes, y: textRect.rectTop + brushSizes - offset })
    // 结束坐标
    temp.push({ x: textRect.rectLeft - brushSizes + textRect.rectWidth, y: textRect.rectTop + brushSizes - offset })
    // 创建一组新的数据
    return { size: brushSizes * 2, pts: temp, lineCap: 'square' }
}



// 对已有的canvas对象做剪切,image 为原有 canva上的图片,
// 返回一个新的canvas对象
export function cutCanvas(canvas: HTMLCanvasElement, image: HTMLImageElement, pageNum: number, pageSize: number) {

    const originalHeight = canvas.height
    const originalWidth = canvas.width


    const offset = (pageNum - 1) * pageSize
    if (offset > originalHeight) {
        return false
    }

    const pn = Math.ceil(originalHeight / pageSize)

    let nowHeight = 0
    if (pageNum < pn) {
        nowHeight = pageSize
    } else if (pageNum === pn) {
        nowHeight = originalHeight - (pageNum - 1) * pageSize
    } else {
        nowHeight = 0
    }


    const tempCanvas: HTMLCanvasElement = document.createElement("canvas")
    tempCanvas.width = originalWidth
    tempCanvas.height = nowHeight

    const ctx = tempCanvas.getContext("2d")
    console.log(originalHeight, originalWidth, "yuanshi ")
    ctx?.drawImage(image, 0, -offset, originalWidth, originalHeight)

    const blob = dataURItoBlob(tempCanvas.toDataURL())
    const turl = URL.createObjectURL(blob)

    console.log("蒙版切片", turl)

    return tempCanvas
}



// canvas 转图像
export async function canvasToImage(canvas: HTMLCanvasElement) {
    const generateImage = () => {
        const dataUrl = canvas.toDataURL()
        const blobn = dataURItoBlob(dataUrl)
        const turl = URL.createObjectURL(blobn)
        console.log("待处理蒙版", turl)

        // 转文件,
        const maskFile = new File([blobn], "temp.png", {
            type: "image/png",
        })
        return maskFile
    }

    return new Promise<HTMLImageElement>((resolve, reject) => {
        const tempImage = new Image()
        const ti = generateImage()
        tempImage.src = URL.createObjectURL(ti)
        tempImage.onload = () => {
            resolve(tempImage)
        }
    })

}