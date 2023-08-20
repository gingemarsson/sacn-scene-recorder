export function up(knex) {
    return knex.schema.alterTable('scene', (table) => {
        table.text('dmxEffects').notNullable().defaultTo('{}');
    });
}

export function down(knex) {
    return knex.schema.alterTable('scene', (table) => {
        table.dropColumn('dmxEffects');
    });
}
