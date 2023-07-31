'use client';

import { SceneData, WebsocketCommand } from '@/models';
import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import SceneCategory from './components/sceneCategory';

export default function Home() {
    const [isEditing, setIsEditing] = useState(false);

    const webSocketUrl = 'ws://' + process.env.NEXT_PUBLIC_HOST + ':' + process.env.NEXT_PUBLIC_WEBSOCKETS_PORT;
    const { sendMessage, lastJsonMessage, readyState } = useWebSocket<{ scenes: SceneData[] }>(webSocketUrl, {
        shouldReconnect: () => true,
    });
    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting...',
        [ReadyState.OPEN]: 'Connected ✓',
        [ReadyState.CLOSING]: 'Closing...',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    const sendCommand = (command: WebsocketCommand) => {
        const payload = JSON.stringify(command);
        sendMessage(payload);
    };

    const scenes = lastJsonMessage?.scenes ?? [];
    const categories: string[] = JSON.parse(process.env.NEXT_PUBLIC_CATEGORIES_JSON ?? '[]');

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-16">
            <div className="z-10 w-full max-w-7xl items-center font-mono text-sm md:flex items-baseline">
                <p className="text-2xl mb-2 flex-grow">sACN Scene Recorder</p>
                <p className="mb-2 mr-3">Status: {connectionStatus}</p>
                <div className="text-right">
                    <button
                        className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 text-xs rounded focus:outline-none focus:shadow-outline w-full md:w-32"
                        type="button"
                        onClick={() => setIsEditing((x) => !x)}
                    >
                        {isEditing ? 'Stop editing' : 'Edit'}
                    </button>
                </div>
            </div>

            <DndProvider backend={HTML5Backend}>
                <div className="w-full max-w-7xl">
                    {categories
                        .filter((category) => isEditing || scenes.filter((x) => x.category === category).length > 0)
                        .map((category, index) => (
                            <SceneCategory
                                key={index}
                                disabled={readyState !== ReadyState.OPEN}
                                isEditing={isEditing}
                                categoryName={category}
                                allScenes={scenes}
                                sendCommand={sendCommand}
                            />
                        ))}

                    {categories.length === 0 ? <p>No scene categories defined. Please update configuration.</p> : null}
                </div>
            </DndProvider>

            <div className="relative flex place-items-center text-slate-50 text-opacity-50 mt-3">
                <small>sACN Scene Recorder v1.0</small>
            </div>
        </main>
    );
}
