'use client';

import { SceneData, WebsocketCommand } from '@/models';
import { useState } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import ManageScene from './components/manageScene';

export default function Home() {
    const [selectedJSON, setSelectedJSON] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [sceneToEdit, setSceneToEdit] = useState<SceneData | null>(null);

    const webSocketUrl = 'ws://' + process.env.NEXT_PUBLIC_HOST + ':8080';
    const { sendMessage, lastJsonMessage, readyState } = useWebSocket<SceneData[]>(webSocketUrl, {
        shouldReconnect: () => true,
    });
    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Connected ✓',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];

    const getCommandJsonForScene = (scene: SceneData): string =>
        JSON.stringify(
            {
                type: 'enable',
                availableTypes: 'enable/disable/add/update/delete/storeDmx/removeDmx',
                sceneId: scene.id,
                metadata: {
                    name: scene.name,
                    color: scene.color,
                },
                universes: Object.keys(scene.dmxData).map((x) => parseInt(x)),
            },
            undefined,
            2,
        );

    const sendCommand = (command: WebsocketCommand) => {
        const payload = JSON.stringify(command);
        console.log(command);
        sendMessage(payload);
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-24">
            <div className="z-10 w-full max-w-6xl items-center justify-between font-mono text-sm lg:flex">
                <p className="text-2xl mb-2">sACN Scene Recorder</p>
                <p className="mb-2">Status: {connectionStatus}</p>
            </div>

            <div className="relative flex w-full max-w-6xl flex-col">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {lastJsonMessage?.map((scene) => (
                        <div
                            className="bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 border-t-8 h-56"
                            key={scene.id}
                            style={{ borderTopColor: scene.color }}
                        >
                            <div className="flex flex-col justify-between h-full">
                                <div>
                                    <h1 className="relative w-full flex-none mb-2 text-2xl font-semibold">
                                        {scene.name}
                                    </h1>
                                    <div className="relative" onClick={() => console.log(scene.dmxData)}>
                                        DMX Universes:{' '}
                                        {Object.keys(scene.dmxData).length > 0
                                            ? Object.keys(scene.dmxData).join(', ')
                                            : 'N/A'}
                                    </div>
                                    <div className="relative">
                                        {Object.keys(scene.dmxData).length > 0
                                            ? Object.keys(scene.dmxData).reduce(
                                                  (sum, universeId) =>
                                                      sum + Object.keys(scene.dmxData[parseInt(universeId)]).length,
                                                  0,
                                              )
                                            : 'No'}{' '}
                                        channels
                                    </div>
                                    {scene.enabled ? (
                                        <div className="relative uppercase text-teal-400">Active</div>
                                    ) : null}
                                </div>
                                {isEditing ? (
                                    <div className="flex flex-row">
                                        <button
                                            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 text-sm rounded focus:outline-none focus:shadow-outline flex-1"
                                            type="button"
                                            onClick={() => setSceneToEdit({ ...scene })}
                                            disabled={readyState != ReadyState.OPEN}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 text-sm rounded focus:outline-none focus:shadow-outline flex-1 ml-3"
                                            type="button"
                                            onClick={() => setSelectedJSON(getCommandJsonForScene(scene))}
                                            disabled={readyState != ReadyState.OPEN}
                                        >
                                            Send JSON
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className={
                                            'text-white font-bold py-2 px-4 text-sm rounded focus:outline-none focus:shadow-outline disabled:bg-gray-700 ' +
                                            (scene.enabled
                                                ? 'bg-teal-500 hover:bg-teal-700'
                                                : 'bg-indigo-500 hover:bg-indigo-700')
                                        }
                                        type="button"
                                        onClick={() =>
                                            sendCommand({
                                                type: scene.enabled ? 'disable' : 'enable',
                                                sceneId: scene.id,
                                            })
                                        }
                                        disabled={readyState != ReadyState.OPEN}
                                    >
                                        {scene.enabled ? 'Deactivate' : 'Activate'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {isEditing ? (
                        <button
                            className="bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 h-56 bg-indigo-500 hover:bg-indigo-700 disabled:bg-gray-700"
                            disabled={readyState != ReadyState.OPEN}
                            onClick={() =>
                                sendCommand({
                                    type: 'add',
                                    metadata: { name: 'New scene', color: '#374151' },
                                })
                            }
                        >
                            + Add new scene
                        </button>
                    ) : null}
                </div>
                {lastJsonMessage?.length === 0 && !isEditing ? (
                    <div className="text-slate-700 mx-auto my-48">
                        No scenes available. Click edit below to add the first one.
                    </div>
                ) : null}

                {isEditing ? (
                    <>
                        <div className="relative flex place-items-center w-full max-w-6xl flex-col">
                            {sceneToEdit !== null ? (
                                <ManageScene
                                    disabled={readyState !== ReadyState.OPEN}
                                    sceneToEdit={sceneToEdit}
                                    setSceneToEdit={setSceneToEdit}
                                    sendCommand={sendCommand}
                                />
                            ) : null}

                            {selectedJSON !== null ? (
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
                                    <div className="flex items-center justify-end">
                                        <button
                                            className="bg-indigo-500 hover:bg-indigo-700 disabled:bg-gray-700 text-sm text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-3"
                                            type="button"
                                            onClick={() => setSelectedJSON(null)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="bg-indigo-500 hover:bg-indigo-700 disabled:bg-gray-700 text-sm text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                            type="button"
                                            onClick={() => sendMessage(selectedJSON)}
                                            disabled={readyState != ReadyState.OPEN}
                                        >
                                            Send
                                        </button>
                                    </div>
                                </form>
                            ) : null}
                        </div>
                    </>
                ) : null}
                {readyState === ReadyState.OPEN && !sceneToEdit ? (
                    <div className="text-right">
                        <button
                            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 text-sm rounded focus:outline-none focus:shadow-outline w-36"
                            type="button"
                            onClick={() => setIsEditing((x) => !x)}
                        >
                            {isEditing ? 'Stop editing' : 'Edit'}
                        </button>
                    </div>
                ) : null}
            </div>

            <div className="relative flex place-items-center text-slate-50 text-opacity-50 mt-3">
                <small>sACN Scene Recorder v0.1</small>
            </div>
        </main>
    );
}
