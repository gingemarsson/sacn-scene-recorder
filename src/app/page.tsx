'use client';

import { useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

export default function Home() {
    const [selectedJSON, setSelectedJSON] = useState('');

    const webSocketUrl = 'ws://' + process.env.NEXT_PUBLIC_HOST + ':8080';
    const { sendMessage, lastMessage, readyState } = useWebSocket(webSocketUrl, {
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
                <span>Status: {connectionStatus}</span>
            </div>

            <div className="relative flex place-items-center">{lastMessage?.data}</div>
            <div className="relative flex place-items-center w-full max-w-5xl">
                <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="json">
                            Send JSON Message
                        </label>
                        <textarea
                            className="shadow appearance-none border rounded w-full h-80 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="json"
                            placeholder="{...}"
                            value={selectedJSON}
                            onChange={(e) => setSelectedJSON(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            type="button"
                            onClick={() => sendMessage(selectedJSON)}
                            disabled={readyState != ReadyState.OPEN}
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>

            <div className="relative flex place-items-center text-slate-50 text-opacity-50">
                <small>sACN Scene Recorder v0.1</small>
            </div>
        </main>
    );
}
