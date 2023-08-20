export function up(knex) {
    return knex.schema.alterTable('scene', (table) => {
        table.integer('effectBpm');
    });
}

export function down(knex) {
    return knex.schema.alterTable('scene', (table) => {
        table.dropColumn('effectBpm');
    });
}
