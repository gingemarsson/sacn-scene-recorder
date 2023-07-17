'use client';

import { sortIndexSortFn } from '@/lib/utils';
import { SceneData, WebsocketCommand } from '@/models';
import { FC, useState } from 'react';
import ManageScene from './manageScene';
import React from 'react';

type Props = {
    disabled: boolean;
    isEditing: boolean;
    categoryName: string;
    scenes: SceneData[];
    sendCommand: (command: WebsocketCommand) => void;
};

const SceneCategory: FC<Props> = ({ sendCommand, scenes, categoryName, isEditing, disabled }: Props) => {
    const [sceneToEdit, setSceneToEdit] = useState<SceneData | null>(null);

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
            <div className="grid grid-cols-1 gap-4 grid-flow-row-dense md:grid-cols-3 lg:grid-cols-5">
                {scenes.sort(sortIndexSortFn).map((scene) => (
                    <React.Fragment key={scene.id}>
                        <div
                            className="bg-gray-800 shadow-md rounded px-6 pt-4 pb-6 mb-4 border-t-8 h-48"
                            style={{ borderTopColor: scene.color }}
                        >
                            <div className="flex flex-col justify-between h-full">
                                <div onClick={() => console.log(scene)}>
                                    <h1 className="relative w-full flex-none mb-1 text-l font-semibold">
                                        {scene.name}
                                    </h1>
                                    {getSceneChannelCount(scene) === 0 ? (
                                        <div className="relative text-xs text-gray-50 text-opacity-50">No DMX data</div>
                                    ) : (
                                        <>
                                            <div className="relative text-xs">
                                                {getSceneChannelCount(scene)} channels
                                            </div>
                                        </>
                                    )}
                                    {scene.enabled ? (
                                        <div className="relative uppercase text-teal-400">Active</div>
                                    ) : null}
                                </div>
                                {isEditing ? (
                                    <div className="flex flex-row">
                                        <button
                                            className={
                                                'text-white font-bold py-2 px-2 text-xs rounded focus:outline-none focus:shadow-outline disabled:bg-gray-700 flex-1 ' +
                                                (sceneToEdit && sceneToEdit.id == scene.id
                                                    ? 'bg-teal-500 hover:bg-teal-700'
                                                    : 'bg-indigo-500 hover:bg-indigo-700')
                                            }
                                            type="button"
                                            onClick={() =>
                                                setSceneToEdit(
                                                    sceneToEdit && sceneToEdit.id == scene.id ? null : { ...scene },
                                                )
                                            }
                                            disabled={disabled}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className={
                                            'text-white font-bold py-2 px-2 text-xs rounded focus:outline-none focus:shadow-outline disabled:bg-gray-700 ' +
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
                        {isEditing && sceneToEdit && sceneToEdit.id == scene.id ? (
                            <div className="col-span-1 md:col-span-3 lg:col-span-5">
                                <ManageScene
                                    disabled={disabled}
                                    sceneToEdit={sceneToEdit}
                                    setSceneToEdit={setSceneToEdit}
                                    sendCommand={sendCommand}
                                />
                            </div>
                        ) : null}
                    </React.Fragment>
                ))}
                {isEditing ? (
                    <button
                        className="bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 h-48 bg-indigo-500 hover:bg-indigo-700 disabled:bg-gray-700 text-white text-opacity-70 hover:text-opacity-100"
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
        </div>
    );
};

export default SceneCategory;
