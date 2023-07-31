import { SceneData, WebsocketCommand } from '@/models';
import { FC } from 'react';
import React from 'react';
import 'rc-slider/assets/index.css';
import { useDrop } from 'react-dnd';

type Props = {
    disabled: boolean;
    isEditing: boolean;
    categoryName: string;
    allScenes: SceneData[];
    sendCommand: (command: WebsocketCommand) => void;
};

const AddSceneButton: FC<Props> = ({ sendCommand, allScenes, categoryName, disabled }: Props) => {
    const scenes = allScenes.filter((x) => x.category === categoryName);

    const nextSortIndex = Math.max(0, ...scenes.map((x) => x.sortIndex)) + 1;
    const [collectedProps, drop] = useDrop(
        () => ({
            accept: 'scene',
            drop: (data: { id: string }) => {
                const sceneToMove = allScenes.find((x) => x.id == data.id);

                if (!sceneToMove) {
                    throw new Error('Invalid scene id ' + data.id);
                }

                sendCommand({
                    type: 'update',
                    sceneId: sceneToMove.id,
                    updateData: {
                        category: categoryName,
                        sortIndex: nextSortIndex,
                    },
                });
            },
            collect: (monitor) => ({
                hovered: monitor.isOver(),
                data: monitor.getItem(),
            }),
        }),
        [allScenes],
    );

    return (
        <button
            className={
                'bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4 h-52 bg-indigo-500 hover:bg-indigo-700 disabled:bg-gray-700 text-white text-opacity-70 hover:text-opacity-100 duration-100 ' +
                (collectedProps.hovered ? 'translate-x-2' : '')
            }
            disabled={disabled}
            ref={drop}
            onClick={() =>
                sendCommand({
                    type: 'add',
                    addData: {
                        name: 'New scene',
                        color: '#374151',
                        category: categoryName,
                        sortIndex: nextSortIndex,
                    },
                })
            }
        >
            + Add new scene
        </button>
    );
};

export default AddSceneButton;
