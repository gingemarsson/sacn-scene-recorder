export function up(knex) {
    return knex.schema.createTable('scene', (table) => {
        table.text('id').primary();
        table.integer('created').notNullable();
        table.integer('updated').notNullable();
        table.text('name').notNullable();
        table.text('color').notNullable();
        table.text('category').notNullable();
        table.integer('sortIndex').notNullable();
        table.text('dmxData').notNullable();
        table.bool('enabled').notNullable();
    });
}

export function down(knex) {
    return knex.schema.dropTable('scene');
}
