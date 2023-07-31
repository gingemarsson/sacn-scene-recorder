import { SceneData, WebsocketCommand } from '@/models';
import { FC, useEffect, useState } from 'react';
import React from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { useDrag, useDrop } from 'react-dnd';
import { sortIndexSortFn } from '@/lib/utils';
import { FaStopwatch, FaGear, FaRss, FaCircleNotch } from 'react-icons/fa6';

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
    var [date, setDate] = useState(Date.now());

    useEffect(() => {
        var timer = setInterval(() => setDate(Date.now()), 100);
        return function cleanup() {
            clearInterval(timer);
        };
    });

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
                        updateData: {
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

    const isFading = date < scene.fadeEnableCompleted || date < scene.fadeDisableCompleted;

    return (
        <div
            className={
                'bg-gray-800 shadow-md rounded px-6 pt-4 pb-6 mb-4 border-t-8 h-52 duration-100 ' +
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
                    <div className="flex gap-2 items-baseline">
                        {scene.enabled || isFading ? (
                            <div
                                className={
                                    'relative uppercase ' +
                                    (scene.useMaster && scene.master === 0 ? 'text-gray-500' : 'text-teal-400')
                                }
                            >
                                Active
                            </div>
                        ) : null}
                        {isFading ? <FaCircleNotch className="animate-spin text-sm" /> : null}
                    </div>
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
                ) : (
                    <div className="w-full">
                        {scene.useMaster ? (
                            <Slider
                                value={scene.master}
                                onChange={(x) => {
                                    sendCommand({
                                        type: 'master',
                                        sceneId: scene.id,
                                        value: x as number,
                                    });
                                }}
                                min={0}
                                max={100}
                                trackStyle={{ backgroundColor: '#14B8A6' }}
                                railStyle={{ backgroundColor: '#6366F1' }}
                                handleStyle={{
                                    backgroundColor: '#4338CA',
                                    opacity: 1,
                                    border: 'none',
                                    width: 15,
                                    height: 15,
                                }}
                                className="mb-3"
                            />
                        ) : null}
                        <button
                            className={
                                'text-white font-bold py-2 px-2 text-xs rounded focus:outline-none focus:shadow-outline disabled:bg-gray-700 w-full ' +
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default SceneCard;
