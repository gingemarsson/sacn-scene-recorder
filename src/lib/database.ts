import { SceneData } from '@/models.js';
import Knex from 'knex';
import knexConfiguration from './knexConfiguration.js';

const knex = Knex<Record<string, unknown>[], Record<string, unknown>[]>(knexConfiguration.production);

export const readScenes = async (): Promise<SceneData[]> =>
    (
        await knex('scene').select({
            id: 'id',
            created: 'created',
            updated: 'updated',
            name: 'name',
            color: 'color',
            category: 'category',
            mqttToggleTopic: 'mqttToggleTopic',
            mqttTogglePath: 'mqttTogglePath',
            mqttToggleValue: 'mqttToggleValue',
            sortIndex: 'sortIndex',
            enabled: 'enabled',
            dmxData: 'dmxData',
            effectBpm: 'effectBpm',
            useMaster: 'useMaster',
            master: 'master',
            fade: 'fade',
            fadeEnableCompleted: 'fadeEnableCompleted',
            fadeDisableCompleted: 'fadeDisableCompleted',
        })
    ).map((scene) => {
        return {
            id: scene.id,
            created: scene.created,
            updated: scene.updated,
            name: scene.name,
            color: scene.color,
            category: scene.category,
            mqttToggleTopic: scene.mqttToggleTopic,
            mqttTogglePath: scene.mqttTogglePath,
            mqttToggleValue: scene.mqttToggleValue,
            sortIndex: scene.sortIndex,
            enabled: scene.enabled,
            dmxData: JSON.parse(scene.dmxData),
            effectBpm: scene.effectBpm,
            useMaster: scene.useMaster,
            master: scene.master,
            fade: scene.fade,
            fadeEnableCompleted: scene.fadeEnableCompleted,
            fadeDisableCompleted: scene.fadeDisableCompleted,
        };
    });

export const saveScenes = async (scenes: SceneData[]) => {
    knex.transaction((trx) => {
        knex('scene')
            .transacting(trx)
            .truncate()
            .then(() =>
                scenes.length > 0
                    ? knex('scene')
                          .transacting(trx)
                          .insert(scenes.map((x) => ({ ...x, dmxData: JSON.stringify(x.dmxData) })))
                    : null,
            )
            .then(trx.commit)
            .catch(trx.rollback);
    });
};
