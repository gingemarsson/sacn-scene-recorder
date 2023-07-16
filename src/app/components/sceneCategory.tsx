'use client';

import { sortIndexSortFn } from '@/lib/utils';
import { SceneData, WebsocketCommand } from '@/models';
import { FC, useState } from 'react';
import ManageScene from './manageScene';

type Props = {
    disabled: boolean;
    isEditing: boolean;
    categoryName: string;
    scenes: SceneData[];
    sendCommand: (command: WebsocketCommand) => void;
    sendMessage: (message: string) => void;
};

const SceneCategory: FC<Props> = ({ sendCommand, sendMessage, scenes, categoryName, isEditing, disabled }: Props) => {
    const [selectedJSON, setSelectedJSON] = useState<string | null>(null);
    const [sceneToEdit, setSceneToEdit] = useState<SceneData | null>(null);

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

    const getSceneChannelCount = (scene: SceneData) => {
        return Object.keys(scene.dmxData).reduce(
            (sum, universeId) => sum + Object.keys(scene.dmxData[parseInt(universeId)]).length,
            0,
        );
    };

    return (
        <div className="relative flex flex-col mt-8">
            <div className="flex justify-start items-baseline gap-3">
                <h1 className="relative flex-none mb-3 text-2xl font-semibold">{categoryName}</h1>
                {scenes.some((x) => x.enabled) ? <div className="relative uppercase text-teal-400">Active</div> : null}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {scenes.sort(sortIndexSortFn).map((scene) => (
                    <div
                        className="bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 border-t-8 h-56"
                        key={scene.id}
                        style={{ borderTopColor: scene.color }}
                    >
                        <div className="flex flex-col justify-between h-full">
                            <div>
                                <h1 className="relative w-full flex-none mb-2 text-xl font-semibold">{scene.name}</h1>
                                {getSceneChannelCount(scene) === 0 ? (
                                    <div className="relative text-sm text-gray-50">No DMX data</div>
                                ) : (
                                    <>
                                        <div className="relative text-sm" onClick={() => console.log(scene.dmxData)}>
                                            DMX Universes: {Object.keys(scene.dmxData).join(', ')}
                                        </div>
                                        <div className="relative text-sm">{getSceneChannelCount(scene)} channels</div>
                                    </>
                                )}
                                {scene.enabled ? <div className="relative uppercase text-teal-400">Active</div> : null}
                            </div>
                            {isEditing ? (
                                <div className="flex flex-row">
                                    <button
                                        className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 text-sm rounded focus:outline-none focus:shadow-outline flex-1"
                                        type="button"
                                        onClick={() => setSceneToEdit({ ...scene })}
                                        disabled={disabled}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 text-sm rounded focus:outline-none focus:shadow-outline flex-1 ml-3"
                                        type="button"
                                        onClick={() => setSelectedJSON(getCommandJsonForScene(scene))}
                                        disabled={disabled}
                                    >
                                        Send JSON
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className={
                                        'text-white font-bold py-4 px-4 text-sm rounded focus:outline-none focus:shadow-outline disabled:bg-gray-700 ' +
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
                                    disabled={disabled}
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
                        disabled={disabled}
                        onClick={() =>
                            sendCommand({
                                type: 'add',
                                metadata: {
                                    name: 'New scene',
                                    color: '#374151',
                                    category: categoryName,
                                    sortIndex: Math.max(0, ...scenes.map((x) => x.sortIndex)) + 1,
                                },
                            })
                        }
                    >
                        + Add new scene
                    </button>
                ) : null}
            </div>
            {scenes.length === 0 && !isEditing ? (
                <div className="text-slate-700 mx-auto my-8">
                    No scenes available. Click edit below to add the first one.
                </div>
            ) : null}

            {isEditing ? (
                <>
                    <div className="relative flex place-items-center w-full max-w-6xl flex-col">
                        {sceneToEdit !== null ? (
                            <ManageScene
                                disabled={disabled}
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
                                        disabled={disabled}
                                    >
                                        Send
                                    </button>
                                </div>
                            </form>
                        ) : null}
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default SceneCategory;
