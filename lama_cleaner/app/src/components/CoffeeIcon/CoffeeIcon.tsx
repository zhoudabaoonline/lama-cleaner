import React, { useState } from 'react'
import { Coffee } from 'react-feather'
import Button from '../shared/Button'
import Modal from '../shared/Modal'
import CoffeeMachineGif from '../../media/coffee-machine-lineal.gif'

const CoffeeIcon = () => {
    const [show, setShow] = useState(false)
    const onClick = () => {
        setShow(true)
    }

    return (
        <div>
            <Button
                onClick={onClick}
                toolTip="Buy me a coffee"
                style={{ border: 0 }}
                icon={<Coffee />}
            />
            <Modal
                onClose={() => setShow(false)}
                title="Buy Me a Coffee"
                className="modal-setting"
                show={show}
                showCloseIcon={false}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <h4 style={{ lineHeight: '24px' }}>
                        <p>Hi, if you found my project is useful, please conside buy me a
                            coffee to support my work. Thanks!</p>
                        Hi,如果您发现我的项目对您有帮助,请考虑给我一杯咖啡赞助我的工作,谢谢!!!
                    </h4>
                    <img
                        src={CoffeeMachineGif}
                        alt="coffee machine"
                        style={{
                            height: 150,
                            objectFit: 'contain',
                        }}
                    />
                </div>

                <div
                    style={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '12px',
                    }}
                >
                    <Button onClick={() => setShow(false)}> No thanks </Button>
                    <a
                        href="https://ko-fi.com/Z8Z1CZJGY"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Button border onClick={() => setShow(false)}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                Sure
                            </div>
                        </Button>
                    </a>
                </div>
            </Modal>
        </div>
    )
}

export default CoffeeIcon
