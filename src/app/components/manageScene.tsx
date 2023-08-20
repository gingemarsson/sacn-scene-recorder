import { DmxUniverseEffects, Effect, EffectData, SceneData, WebsocketCommand } from '@/models';
import { FC, useEffect, useState } from 'react';
import { SliderPicker } from 'react-color';

type Props = {
    disabled: boolean;
    sceneToEdit: SceneData;
    setSceneToEdit: (updateFunction: (scene: SceneData | null) => SceneData | null) => void;
    sendCommand: (command: WebsocketCommand) => void;
};

const ManageScene: FC<Props> = ({ disabled, sceneToEdit, setSceneToEdit, sendCommand }: Props) => {
    const universes: number[] = JSON.parse(process.env.NEXT_PUBLIC_UNIVERSES_JSON ?? '[1]');
    const [selectedUniverses, setSelectedUniverses] = useState<number[]>(universes);
    const [effectToEdit, setEffectToEdit] = useState<EffectData>({
        universeId: 1,
        channelId: 1,
        effect: { type: 'sin-wave', bpm: 60, phase: 0 },
    });

    const [tab, setTab] = useState<'metadata' | 'effects'>('metadata');

    const effects = Object.keys(sceneToEdit.dmxEffects).flatMap((universeId) =>
        Object.keys(sceneToEdit.dmxEffects[parseInt(universeId)]).map((channelId) => ({
            universeId: parseInt(universeId),
            channelId: parseInt(channelId),
            effect: sceneToEdit.dmxEffects[parseInt(universeId)][parseInt(channelId)],
        })),
    );

    const removeEffect = ({ universeId, channelId }: EffectData) => {
        setSceneToEdit((x) => {
            if (x === null) {
                return null;
            }

            const updatedDmxEffectsForUniverse = { ...x.dmxEffects[universeId] };
            delete updatedDmxEffectsForUniverse[channelId];

            return { ...x, dmxEffects: { ...x.dmxEffects, [universeId]: updatedDmxEffectsForUniverse } };
        });
    };

    const setEffect = ({ universeId, channelId, effect }: EffectData) => {
        if (!effect) {
            return;
        }

        setSceneToEdit((x) => {
            if (x === null) {
                return null;
            }

            const updatedDmxEffectsForUniverse = { ...x.dmxEffects[universeId] };
            updatedDmxEffectsForUniverse[channelId] = effect;

            return { ...x, dmxEffects: { ...x.dmxEffects, [universeId]: updatedDmxEffectsForUniverse } };
        });
    };

    const editEffect = ({ universeId, channelId }: EffectData) => {
        setEffectToEdit({ universeId, channelId, effect: sceneToEdit.dmxEffects[universeId][channelId] });
    };

    return (
        <form className="bg-white shadow-md rounded px-6 pt-4 pb-6 mb-4 w-full">
            <div className="flex justify-between">
                <h1 className="text-gray-900 font-semibold">
                    Manage scene &quot;{sceneToEdit?.name}&quot;{' '}
                    <span className="text-xs font-normal text-gray-400">{sceneToEdit?.id}</span>
                </h1>
                <button
                    className="bg-indigo-500 hover:bg-indigo-700 disabled:bg-gray-700 text-xs text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="button"
                    onClick={() => setSceneToEdit(() => null)}
                >
                    Close
                </button>
            </div>
            <div className="text-sm font-medium text-center text-gray-500">
                <ul className="flex flex-wrap mb-3">
                    <li className="mr-2">
                        <a
                            href="#"
                            className={
                                'inline-block p-4 border-b-2 rounded-t-lg' +
                                (tab === 'metadata'
                                    ? ' active text-blue-500 border-blue-500'
                                    : ' hover:text-gray-600 hover:border-gray-300')
                            }
                            aria-current={tab === 'metadata' ? 'page' : undefined}
                            onClick={() => setTab('metadata')}
                        >
                            Configuration
                        </a>
                    </li>
                    <li className="mr-2">
                        <a
                            href="#"
                            className={
                                'inline-block p-4 border-b-2 rounded-t-lg' +
                                (tab === 'effects'
                                    ? ' active text-blue-500 border-blue-500'
                                    : ' hover:text-gray-600 hover:border-gray-300')
                            }
                            aria-current={tab === 'effects' ? 'page' : undefined}
                            onClick={() => setTab('effects')}
                        >
                            Effects
                        </a>
                    </li>
                </ul>
            </div>

            {tab === 'metadata' ? (
                <div className="flex gap-4 flex-col md:flex-row">
                    <div className="grow">
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                                Name
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                                type="text"
                                id="name"
                                placeholder="My favorite scene"
                                value={sceneToEdit.name}
                                onChange={(e) =>
                                    setSceneToEdit((x) => (x === null ? null : { ...x, name: e.target.value ?? '' }))
                                }
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="color">
                                Color
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-3 text-sm"
                                type="text"
                                id="color"
                                placeholder="#374151"
                                value={sceneToEdit.color}
                                onChange={(e) =>
                                    setSceneToEdit((x) => (x === null ? null : { ...x, color: e.target.value ?? '' }))
                                }
                            />
                            <SliderPicker
                                color={sceneToEdit.color}
                                onChange={(color) =>
                                    setSceneToEdit((x) => (x === null ? null : { ...x, color: color.hex }))
                                }
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fade">
                                    Fade time in ms
                                </label>
                                <input
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                                    type="number"
                                    id="fade"
                                    placeholder="0"
                                    value={sceneToEdit.fade}
                                    onChange={(e) =>
                                        setSceneToEdit((x) =>
                                            x === null ? null : { ...x, fade: parseInt(e.target.value ?? '') },
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Master fader</label>
                                <button
                                    className={
                                        'text-white font-bold py-2 px-2 text-xs rounded focus:outline-none focus:shadow-outline disabled:bg-gray-700 w-full ' +
                                        (sceneToEdit.useMaster
                                            ? 'bg-teal-500 hover:bg-teal-700'
                                            : 'bg-indigo-500 hover:bg-indigo-700')
                                    }
                                    type="button"
                                    onClick={() => {
                                        setSceneToEdit((x) =>
                                            x === null ? null : { ...x, useMaster: !sceneToEdit.useMaster },
                                        );
                                    }}
                                    disabled={disabled}
                                >
                                    {sceneToEdit.useMaster ? '✓ Enabled' : 'Disabled'}
                                </button>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">MQTT Control</label>
                                <button
                                    className={
                                        'text-white font-bold py-2 px-2 text-xs rounded focus:outline-none focus:shadow-outline disabled:bg-gray-700 w-full ' +
                                        (sceneToEdit.mqttToggleTopic !== null
                                            ? 'bg-teal-500 hover:bg-teal-700'
                                            : 'bg-indigo-500 hover:bg-indigo-700')
                                    }
                                    type="button"
                                    onClick={() => {
                                        setSceneToEdit((x) =>
                                            x === null
                                                ? null
                                                : {
                                                      ...x,
                                                      mqttToggleTopic: sceneToEdit.mqttToggleTopic === null ? '' : null,
                                                  },
                                        );
                                    }}
                                    disabled={disabled}
                                >
                                    {sceneToEdit.mqttToggleTopic !== null ? '✓ Enabled' : 'Disabled'}
                                </button>
                            </div>
                        </div>
                        {sceneToEdit.mqttToggleTopic !== null ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
                                <div>
                                    <label
                                        className="block text-gray-700 text-sm font-bold mb-2"
                                        htmlFor="mqttToggleTopic"
                                    >
                                        MQTT Topic
                                    </label>
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                                        type="text"
                                        id="mqttToggleTopic"
                                        placeholder="..."
                                        value={sceneToEdit.mqttToggleTopic}
                                        onChange={(e) =>
                                            setSceneToEdit((x) =>
                                                x === null ? null : { ...x, mqttToggleTopic: e.target.value ?? '' },
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <label
                                        className="block text-gray-700 text-sm font-bold mb-2"
                                        htmlFor="mqttTogglePath"
                                    >
                                        MQTT Path
                                    </label>
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                                        type="text"
                                        id="mqttTogglePath"
                                        placeholder="event"
                                        value={sceneToEdit.mqttTogglePath}
                                        onChange={(e) =>
                                            setSceneToEdit((x) =>
                                                x === null ? null : { ...x, mqttTogglePath: e.target.value ?? '' },
                                            )
                                        }
                                    />
                                </div>
                                <div>
                                    <label
                                        className="block text-gray-700 text-sm font-bold mb-2"
                                        htmlFor="mqttToggleValue"
                                    >
                                        MQTT Value
                                    </label>
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                                        type="text"
                                        id="mqttToggleValue"
                                        placeholder="button-pressed"
                                        value={sceneToEdit.mqttToggleValue}
                                        onChange={(e) =>
                                            setSceneToEdit((x) =>
                                                x === null ? null : { ...x, mqttToggleValue: e.target.value ?? '' },
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        ) : null}
                        <div className="flex items-center justify-end">
                            <button
                                className="bg-indigo-500 hover:bg-indigo-700 disabled:bg-gray-700 text-xs text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                type="button"
                                onClick={() =>
                                    sendCommand({
                                        type: 'update',
                                        sceneId: sceneToEdit.id,
                                        updateData: {
                                            name: sceneToEdit.name,
                                            color: sceneToEdit.color,
                                            category: sceneToEdit.category,
                                            mqttToggleTopic: sceneToEdit.mqttToggleTopic,
                                            mqttTogglePath: sceneToEdit.mqttTogglePath,
                                            mqttToggleValue: sceneToEdit.mqttToggleValue,
                                            useMaster: sceneToEdit.useMaster,
                                            fade: sceneToEdit.fade,
                                        },
                                    })
                                }
                                disabled={disabled}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                    <div className="min-w-72">
                        <div className="flex flex-col gap-3">
                            <div className="bg-gray-200 rounded shadow-md py-4 px-4 my-3">
                                <span className="block text-gray-700 text-sm font-bold mb-2">Universes</span>
                                <div className="mb-3 flex gap-3">
                                    {universes.map((universeId) => (
                                        <button
                                            key={universeId}
                                            className={
                                                'text-white font-bold py-2 px-2 text-xs rounded focus:outline-none focus:shadow-outline disabled:bg-gray-700 w-10 ' +
                                                (selectedUniverses.some((x) => x === universeId)
                                                    ? 'bg-teal-500 hover:bg-teal-700'
                                                    : 'bg-indigo-500 hover:bg-indigo-700')
                                            }
                                            type="button"
                                            onClick={() => {
                                                setSelectedUniverses((universes) =>
                                                    universes.some((x) => x === universeId)
                                                        ? universes.filter((x) => x !== universeId)
                                                        : [universeId, ...universes],
                                                );
                                            }}
                                            disabled={disabled}
                                        >
                                            {universeId}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    className="bg-indigo-500 hover:bg-indigo-700 disabled:bg-gray-700 text-xs text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                                    type="button"
                                    onClick={() => {
                                        sendCommand({
                                            type: 'storeDmx',
                                            sceneId: sceneToEdit.id,
                                            universes: selectedUniverses,
                                        });
                                    }}
                                    disabled={disabled || selectedUniverses.length === 0}
                                >
                                    Save DMX
                                </button>
                                <button
                                    className="bg-indigo-500 hover:bg-indigo-700 disabled:bg-gray-700 text-xs text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-3 w-full"
                                    type="button"
                                    onClick={() => {
                                        sendCommand({
                                            type: 'removeDmx',
                                            sceneId: sceneToEdit.id,
                                            universes: selectedUniverses,
                                        });
                                    }}
                                    disabled={disabled || selectedUniverses.length === 0}
                                >
                                    Remove DMX
                                </button>
                            </div>
                            <button
                                className="bg-red-500 hover:bg-red-700 disabled:bg-gray-700 text-xs text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                type="button"
                                onClick={() => {
                                    sendCommand({
                                        type: 'delete',
                                        sceneId: sceneToEdit.id,
                                    });
                                    setSceneToEdit(() => null);
                                }}
                                disabled={disabled}
                            >
                                Delete scene
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {tab === 'effects' ? (
                <div>
                    <p className="text-gray-500 text-sm mb-3">
                        The effect value multiplies the stored DMX value of the scene. Therefore, effects on channels
                        which are not part of the scene will have not affect the output.
                    </p>
                    <table className="w-full text-sm text-left text-gray-500 table-fixed mb-3">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">
                                    DMX universe
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    DMX channel
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    BPM
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Phase
                                </th>
                                <th scope="col" className="px-6 py-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {effects.map((effect) => (
                                <tr key={effect.universeId + '-' + effect.channelId} className="bg-white border-b">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {effect.universeId}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {effect.channelId}
                                    </td>
                                    <td className="px-6 py-4">{effect.effect?.bpm} bpm</td>
                                    <td className="px-6 py-4">{effect.effect?.phase} degrees</td>
                                    <td className="px-6 py-1">
                                        <div className="flex gap-4">
                                            <button
                                                className="bg-indigo-500 hover:bg-indigo-700 disabled:bg-gray-700 text-xs text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
                                                type="button"
                                                onClick={() => {
                                                    editEffect(effect);
                                                }}
                                                disabled={disabled}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="bg-red-500 hover:bg-red-700 disabled:bg-gray-700 text-xs text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline"
                                                type="button"
                                                onClick={() => {
                                                    removeEffect(effect);
                                                }}
                                                disabled={disabled}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-white border-b">
                                <td scope="row" className="px-3 py-1 font-medium text-gray-900 whitespace-nowrap">
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                                        type="number"
                                        id="universe"
                                        placeholder="Universe"
                                        value={effectToEdit.universeId}
                                        onChange={(e) =>
                                            setEffectToEdit((x) => ({ ...x, universeId: parseInt(e.target.value) }))
                                        }
                                    />
                                </td>
                                <td className="px-3 py-1 font-medium text-gray-900 whitespace-nowrap">
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                                        type="number"
                                        id="channel"
                                        placeholder="Channel"
                                        value={effectToEdit.channelId}
                                        onChange={(e) =>
                                            setEffectToEdit((x) => ({ ...x, channelId: parseInt(e.target.value) }))
                                        }
                                    />
                                </td>
                                <td className="px-3 py-1">
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                                        type="number"
                                        id="effectBPM"
                                        placeholder="60"
                                        value={effectToEdit.effect?.bpm}
                                        onChange={(e) =>
                                            setEffectToEdit((x) =>
                                                x.effect
                                                    ? {
                                                          ...x,
                                                          effect: { ...x.effect, bpm: parseInt(e.target.value) },
                                                      }
                                                    : x,
                                            )
                                        }
                                    />
                                </td>
                                <td className="px-3 py-1">
                                    <input
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline text-sm"
                                        type="number"
                                        id="effectPhase"
                                        placeholder="0"
                                        value={effectToEdit.effect?.phase}
                                        onChange={(e) =>
                                            setEffectToEdit((x) =>
                                                x.effect
                                                    ? {
                                                          ...x,
                                                          effect: { ...x.effect, phase: parseInt(e.target.value) },
                                                      }
                                                    : x,
                                            )
                                        }
                                    />
                                </td>
                                <td className="px-6 py-1">
                                    <button
                                        className={
                                            'text-white font-bold py-2 px-2 text-xs rounded focus:outline-none focus:shadow-outline disabled:bg-gray-700 w-full bg-indigo-500 hover:bg-indigo-700'
                                        }
                                        type="button"
                                        onClick={() => setEffect(effectToEdit)}
                                        disabled={disabled}
                                    >
                                        Set
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="flex items-center justify-end">
                        <button
                            className="bg-indigo-500 hover:bg-indigo-700 disabled:bg-gray-700 text-xs text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            type="button"
                            onClick={() =>
                                sendCommand({
                                    type: 'update',
                                    sceneId: sceneToEdit.id,
                                    updateData: {
                                        dmxEffects: sceneToEdit.dmxEffects,
                                    },
                                })
                            }
                            disabled={disabled}
                        >
                            Save
                        </button>
                    </div>
                </div>
            ) : null}
        </form>
    );
};

export default ManageScene;
