export function up(knex) {
    return knex.schema.createTable('scene', (table) => {
        table.text('id').primary();
        table.integer('created').notNullable();
        table.integer('updated').notNullable();
        table.text('name').notNullable();
        table.text('color').notNullable();
        table.text('category').notNullable();
        table.integer('sortIndex').notNullable();

        table.text('mqttToggleTopic');
        table.text('mqttTogglePath').notNullable();
        table.text('mqttToggleValue').notNullable();

        table.text('dmxData').notNullable();
        table.bool('enabled').notNullable();
        table.integer('master').notNullable();
        table.bool('useMaster').notNullable();
        table.integer('fade').notNullable();
        table.integer('fadeEnableCompleted').notNullable();
        table.integer('fadeDisableCompleted').notNullable();
    });
}

export function down(knex) {
    return knex.schema.dropTable('scene');
}
