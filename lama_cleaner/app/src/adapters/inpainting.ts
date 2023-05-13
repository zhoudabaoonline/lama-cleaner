import { PluginName } from '../components/Plugins/Plugins'
import { Rect, Settings } from '../store/atoms/Atoms'
import { dataURItoBlob, loadImage, srcToFile } from '../utils'

export const API_ENDPOINT = `${process.env.REACT_APP_INPAINTING_URL}`

export const TEXT_RECOGNITION_API_ENDPOINT = `${process.env.REACT_APP_TEXTRECOGNITION_URL}${process.env.REACT_APP_PRE_PATH}`

export async function uploadImage(
    imageFile: File
) {
    const fd = new FormData()
    fd.append('image', imageFile)
    fd.append('filename', imageFile.name)

    try {
        const res = await fetch(`${API_ENDPOINT}/upload_image`, {
            method: 'POST',
            body: fd,
        })
        if (res.ok) {
            return res.json()
        }
    }
    catch (e) {
        console.log(e)
    }
}

// 去文字接口
export async function textInpaint(
    fileName: string,
    left: number,
    top: number,
    right: number,
    bottom: number,
    id: number,
) {

    const fd = new FormData()
    fd.append('fileName', fileName.toString())
    fd.append('left', left.toString())
    fd.append('top', top.toString())
    fd.append('right', right.toString())
    fd.append('bottom', bottom.toString())
    fd.append('id', id.toString())
    fd.append('offset_width', `${process.env.REACT_APP_OFFSETKUANG_WIDTH}`)
    fd.append('offset_height', `${process.env.REACT_APP_OFFSETKUANG_HEIGHT}`)

    try {
        // 接口
        const res = await fetch(`${API_ENDPOINT}/textinpaint`, {
            method: 'POST',
            body: fd,
        })
        if (res.ok) {
            const blob = await res.blob()
            const newSeed = res.headers.get('x-seed')
            const newSpliceId = res.headers.get('splice-id')
            // return { blob: URL.createObjectURL(blob), seed: newSeed, spliceId: newSpliceId }
            return { blob, seed: newSeed, spliceId: newSpliceId }
        }
        const errMsg = await res.text()
        throw new Error(errMsg)
    } catch (error) {
        throw new Error(`Something went wrong: ${error}`)
    }
}


// 区域文字处理,上传文字处理蒙版,上传文字处理区域信息
// export async function textInpaint(
//     spliceId: number,
//     maskFile: File,
//     pageSize: number
// ) {
//     const fd = new FormData()

//     fd.append('mask', maskFile)
//     fd.append('splice_id', spliceId.toString())
//     fd.append('page_size', pageSize.toString())


//     try {
//         // 接口
//         const res = await fetch(`${API_ENDPOINT}/textinpaint`, {
//             method: 'POST',
//             body: fd,
//         })
//         if (res.ok) {
//             const blob = await res.blob()
//             const newSeed = res.headers.get('x-seed')
//             const newSpliceId = res.headers.get('splice-id')
//             return { blob: URL.createObjectURL(blob), seed: newSeed, spliceId: newSpliceId }
//         }
//         const errMsg = await res.text()
//         throw new Error(errMsg)
//     } catch (error) {
//         throw new Error(`Something went wrong: ${error}`)
//     }
// }



// 图像处理api接口
export default async function inpaint(
    fileName: string,
    settings: Settings,
    croperRect: Rect,
    prompt?: string,
    negativePrompt?: string,
    seed?: number,
    maskBase64?: string,
    customMask?: File,
    paintByExampleImage?: File
) {
    // 1080, 2000, Original
    const fd = new FormData()
    fd.append('fileName', fileName)
    if (maskBase64 !== undefined) {
        fd.append('mask', dataURItoBlob(maskBase64))
    } else if (customMask !== undefined) {
        fd.append('mask', customMask)
    }

    const hdSettings = settings.hdSettings[settings.model]
    fd.append('ldmSteps', settings.ldmSteps.toString())
    fd.append('ldmSampler', settings.ldmSampler.toString())
    fd.append('zitsWireframe', settings.zitsWireframe.toString())
    fd.append('hdStrategy', hdSettings.hdStrategy)
    fd.append('hdStrategyCropMargin', hdSettings.hdStrategyCropMargin.toString())
    fd.append(
        'hdStrategyCropTrigerSize',
        hdSettings.hdStrategyCropTrigerSize.toString()
    )
    fd.append(
        'hdStrategyResizeLimit',
        hdSettings.hdStrategyResizeLimit.toString()
    )

    fd.append('prompt', prompt === undefined ? '' : prompt)
    fd.append(
        'negativePrompt',
        negativePrompt === undefined ? '' : negativePrompt
    )
    fd.append('croperX', croperRect.x.toString())
    fd.append('croperY', croperRect.y.toString())
    fd.append('croperHeight', croperRect.height.toString())
    fd.append('croperWidth', croperRect.width.toString())
    fd.append('useCroper', settings.showCroper ? 'true' : 'false')

    fd.append('sdMaskBlur', settings.sdMaskBlur.toString())
    fd.append('sdStrength', settings.sdStrength.toString())
    fd.append('sdSteps', settings.sdSteps.toString())
    fd.append('sdGuidanceScale', settings.sdGuidanceScale.toString())
    fd.append('sdSampler', settings.sdSampler.toString())
    fd.append('sdSeed', seed ? seed.toString() : '-1')
    fd.append('sdMatchHistograms', settings.sdMatchHistograms ? 'true' : 'false')
    fd.append('sdScale', (settings.sdScale / 100).toString())

    fd.append('cv2Radius', settings.cv2Radius.toString())
    fd.append('cv2Flag', settings.cv2Flag.toString())

    fd.append('paintByExampleSteps', settings.paintByExampleSteps.toString())
    fd.append(
        'paintByExampleGuidanceScale',
        settings.paintByExampleGuidanceScale.toString()
    )
    fd.append('paintByExampleSeed', seed ? seed.toString() : '-1')
    fd.append(
        'paintByExampleMaskBlur',
        settings.paintByExampleMaskBlur.toString()
    )
    fd.append(
        'paintByExampleMatchHistograms',
        settings.paintByExampleMatchHistograms ? 'true' : 'false'
    )
    // TODO: resize image's shortest_edge to 224 before pass to backend, save network time?
    // https://huggingface.co/docs/transformers/model_doc/clip#transformers.CLIPImageProcessor
    if (paintByExampleImage) {
        fd.append('paintByExampleImage', paintByExampleImage)
    }

    // InstructPix2Pix
    fd.append('p2pSteps', settings.p2pSteps.toString())
    fd.append('p2pImageGuidanceScale', settings.p2pImageGuidanceScale.toString())
    fd.append('p2pGuidanceScale', settings.p2pGuidanceScale.toString())

    // ControlNet
    fd.append(
        'controlnet_conditioning_scale',
        settings.controlnetConditioningScale.toString()
    )

    try {
        // 接口
        const res = await fetch(`${API_ENDPOINT}/inpaint`, {
            method: 'POST',
            body: fd,
        })
        if (res.ok) {
            const blob = await res.blob()
            const newSeed = res.headers.get('x-seed')
            const newSpliceId = res.headers.get('splice-id')
            return { blob, seed: newSeed, spliceId: newSpliceId }
        }
        const errMsg = await res.text()
        throw new Error(errMsg)
    } catch (error) {
        throw new Error(`Something went wrong: ${error}`)
    }
}


// 文字识别接口
// top = form["top"]
// left = form["left"]
// right = form["right"]
// bottom = form["bottom"]
// cuted = form["cuted"]

export async function textRecognition(
    fileName: string,
    cordingObj: { top: number, left: number, right: number, bottom: number } | undefined,
) {
    const fd = new FormData()
    fd.append('fileName', fileName)
    // 剪切图像
    if (cordingObj) {
        fd.append('top', cordingObj.top.toString())
        fd.append('left', cordingObj.left.toString())
        fd.append('right', cordingObj.right.toString())
        fd.append('bottom', cordingObj.bottom.toString())
        fd.append('cuted', "true")
    }

    try {
        const res = await fetch(`${TEXT_RECOGNITION_API_ENDPOINT}/textrecognition`, {
            method: 'POST',
            body: fd,
        })
        return res
    } catch (error) {
        throw new Error(`Something went wrong: ${error}`)
    }
}

export function getServerConfig() {
    return fetch(`${API_ENDPOINT}/server_config`, {
        method: 'GET',
    })
}

export function switchModel(name: string) {
    const fd = new FormData()
    fd.append('name', name)
    return fetch(`${API_ENDPOINT}/model`, {
        method: 'POST',
        body: fd,
    })
}

export function currentModel() {
    return fetch(`${API_ENDPOINT}/model`, {
        method: 'GET',
    })
}

export function isDesktop() {
    return fetch(`${API_ENDPOINT}/is_desktop`, {
        method: 'GET',
    })
}

export function modelDownloaded(name: string) {
    return fetch(`${API_ENDPOINT}/model_downloaded/${name}`, {
        method: 'GET',
    })
}

export async function runPlugin(
    name: string,
    imageFile: File,
    upscale?: number,
    maskFile?: File | null,
    clicks?: number[][]
) {
    const fd = new FormData()
    fd.append('name', name)
    fd.append('image', imageFile)
    if (upscale) {
        fd.append('upscale', upscale.toString())
    }
    if (clicks) {
        fd.append('clicks', JSON.stringify(clicks))
    }
    if (maskFile) {
        fd.append('mask', maskFile)
    }

    try {
        const res = await fetch(`${API_ENDPOINT}/run_plugin`, {
            method: 'POST',
            body: fd,
        })
        if (res.ok) {
            const blob = await res.blob()
            return { blob: URL.createObjectURL(blob) }
        }
        const errMsg = await res.text()
        throw new Error(errMsg)
    } catch (error) {
        throw new Error(`Something went wrong: ${error}`)
    }
}

export async function getMediaFile(tab: string, filename: string) {
    const res = await fetch(
        `${API_ENDPOINT}/media/${tab}/${encodeURIComponent(filename)}`,
        {
            method: 'GET',
        }
    )
    if (res.ok) {
        const blob = await res.blob()
        const file = new File([blob], filename)
        return file
    }
    const errMsg = await res.text()
    throw new Error(errMsg)
}

export async function getMedias(tab: string) {
    const res = await fetch(`${API_ENDPOINT}/medias/${tab}`, {
        method: 'GET',
    })
    if (res.ok) {
        const filenames = await res.json()
        return filenames
    }
    const errMsg = await res.text()
    throw new Error(errMsg)
}

// 保存图像处理,如果是filemanager模式,那么文件直接保存到输出目录
export async function downloadToOutput(
    image: HTMLImageElement,
    filename: string,
    mimeType: string
) {
    // blob:http://localhost:3000/aa60bc29-5d99-4697-90be-e5ee6e7e0201 scr1.png image/png ddddddddddddddddd
    // console.log(image.src, filename, mimeType, "ddddddddddddddddd")
    const file = await srcToFile(image.src, filename, mimeType)
    const fd = new FormData()
    fd.append('image', file)
    fd.append('filename', filename)

    try {
        const res = await fetch(`${API_ENDPOINT}/save_image`, {
            method: 'POST',
            body: fd,
        })
        if (!res.ok) {
            const errMsg = await res.text()
            throw new Error(errMsg)
        }
    } catch (error) {
        throw new Error(`Something went wrong: ${error}`)
    }
}

export async function makeGif(
    originFile: File,
    cleanImage: HTMLImageElement,
    filename: string,
    mimeType: string
) {
    const cleanFile = await srcToFile(cleanImage.src, filename, mimeType)
    const fd = new FormData()
    fd.append('name', PluginName.MakeGIF)
    fd.append('image', originFile)
    fd.append('clean_img', cleanFile)
    fd.append('filename', filename)

    try {
        const res = await fetch(`${API_ENDPOINT}/run_plugin`, {
            method: 'POST',
            body: fd,
        })
        if (!res.ok) {
            const errMsg = await res.text()
            throw new Error(errMsg)
        }

        const blob = await res.blob()
        const newImage = new Image()
        await loadImage(newImage, URL.createObjectURL(blob))
        return newImage
    } catch (error) {
        throw new Error(`Something went wrong: ${error}`)
    }
}
