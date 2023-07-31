import { SceneData, WebsocketCommand } from '@/models';
import { FC } from 'react';
import React from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useDrag, useDrop } from 'react-dnd';
import { sortIndexSortFn } from '@/lib/utils';
import { FaStopwatch, FaGear, FaRss } from 'react-icons/fa6';

type Props = {
    disabled: boolean;
    isEditing: boolean;
    scene: SceneData;
    allScenes: SceneData[];
    sendCommand: (command: WebsocketCommand) => void;
    isEditingThisScene: boolean;
    setSceneToEdit: (scene: SceneData | null) => void;
};

const SceneCard: FC<Props> = ({
    sendCommand,
    scene,
    allScenes,
    isEditing,
    disabled,
    isEditingThisScene,
    setSceneToEdit,
}: Props) => {
    const getSceneChannelCount = (scene: SceneData) => {
        return Object.keys(scene.dmxData).reduce(
            (sum, universeId) => sum + Object.keys(scene.dmxData[parseInt(universeId)]).length,
            0,
        );
    };

    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'scene',
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        item: { id: scene.id },
    }));

    const [collectedProps, drop] = useDrop(
        () => ({
            accept: 'scene',
            drop: (data: { id: string }) => {
                const target = scene;

                if (data.id === target.id) {
                    return;
                }

                const sceneToMove = allScenes.find((x) => x.id == data.id);

                if (!sceneToMove) {
                    throw new Error('Invalid scene id ' + data.id);
                }

                // Sort list and add item in new place
                const sortedList = [
                    ...allScenes.filter((x) => x.category === target.category && x.id !== sceneToMove.id),
                ].sort(sortIndexSortFn);
                const targetIndex = sortedList.findIndex((x) => x.id === target.id);
                sortedList.splice(targetIndex, 0, sceneToMove);

                // Set sort indexes
                let sortIndex = 0;
                const updatedList = sortedList.map((x) => ({
                    ...x,
                    sortIndex: (sortIndex += 10),
                    category: target.category,
                }));

                updatedList.forEach((x) =>
                    sendCommand({
                        type: 'update',
                        sceneId: x.id,
                        metadata: {
                            category: x.category,
                            sortIndex: x.sortIndex,
                        },
                    }),
                );
            },
            collect: (monitor) => ({
                hovered: monitor.isOver(),
                data: monitor.getItem(),
            }),
        }),
        [allScenes],
    );

    return (
        <div
            className={
                'bg-gray-800 shadow-md rounded px-6 pt-4 pb-6 mb-4 border-t-8 h-48 duration-100 ' +
                (collectedProps.hovered && collectedProps.data.id !== scene.id ? 'translate-x-2 ' : '') +
                (isEditing ? 'hover:bg-gray-700 cursor-pointer' : '')
            }
            style={{ borderTopColor: scene.color, opacity: isDragging ? 0.5 : 1 }}
            ref={drop}
        >
            <div className="flex flex-col justify-between h-full" ref={isEditing ? drag : null}>
                <div onClick={() => console.log(scene)}>
                    <h1 className="relative w-full flex-none mb-1 text-l font-semibold line-clamp-2">{scene.name}</h1>
                    <div className="relative text-xs flex gap-1 mb-1 items-baseline">
                        {getSceneChannelCount(scene) === 0 ? (
                            <div className="text-gray-50 text-opacity-50">No DMX data</div>
                        ) : (
                            <div>{getSceneChannelCount(scene)} channels</div>
                        )}
                        {isEditing ? (
                            <div className="flex gap-1">
                                {scene.fade > 0 ? <FaStopwatch title="Fade enabled" /> : null}
                                {scene.useMaster ? <FaGear title="Master fader enabled" /> : null}
                                {scene.mqttToggleTopic !== null ? <FaRss title="MQTT Control enabled" /> : null}
                            </div>
                        ) : null}
                    </div>
                    {scene.enabled ? <div className="relative uppercase text-teal-400">Active</div> : null}
                </div>
                {isEditing ? (
                    <div className="flex flex-row">
                        <button
                            className={
                                'text-white font-bold py-2 px-2 text-xs rounded focus:outline-none focus:shadow-outline disabled:bg-gray-700 flex-1 ' +
                                (isEditingThisScene
                                    ? 'bg-teal-500 hover:bg-teal-700'
                                    : 'bg-indigo-500 hover:bg-indigo-700')
                            }
                            type="button"
                            onClick={() => setSceneToEdit(isEditingThisScene ? null : { ...scene })}
                            disabled={disabled}
                        >
                            Edit
                        </button>
                    </div>
                ) : scene.useMaster ? (
                    <Slider
                        value={scene.master}
                        onChange={(x) => {
                            sendCommand({
                                type: 'master',
                                sceneId: scene.id,
                                value: x as number,
                            });
                            if (scene.enabled && x === 0) {
                                sendCommand({
                                    type: 'disable',
                                    sceneId: scene.id,
                                });
                            }
                            if (!scene.enabled && x !== 0) {
                                sendCommand({
                                    type: 'enable',
                                    sceneId: scene.id,
                                });
                            }
                        }}
                        min={0}
                        max={100}
                        railStyle={{ backgroundColor: scene.master === 0 ? '#14B8A6' : '#6366F1' }}
                        handleStyle={{
                            backgroundColor: scene.master === 0 ? '#0F766E' : '#4338CA',
                            opacity: 1,
                            border: 'none',
                            width: 15,
                            height: 15,
                        }}
                    />
                ) : (
                    <button
                        className={
                            'text-white font-bold py-2 px-2 text-xs rounded focus:outline-none focus:shadow-outline disabled:bg-gray-700 ' +
                            (scene.enabled ? 'bg-teal-500 hover:bg-teal-700' : 'bg-indigo-500 hover:bg-indigo-700')
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
    );
};

export default SceneCard;
