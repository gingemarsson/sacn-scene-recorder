'use client';

import useWebSocket, { ReadyState } from 'react-use-websocket';

export default function Home() {
    const webSocketUrl = 'ws://' + process.env.NEXT_PUBLIC_HOST + ':8080';
    const { lastMessage, readyState } = useWebSocket(webSocketUrl, {
        onOpen: () => console.log('opened'),
        shouldReconnect: () => true,
    });
    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
            <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
                sACN Scene Recorder
            </div>

            <div className="relative flex place-items-center">{lastMessage?.data}</div>

            <div className="relative flex place-items-center">
                Websocket state: {connectionStatus} / URL: {webSocketUrl}
            </div>
        </main>
    );
}
