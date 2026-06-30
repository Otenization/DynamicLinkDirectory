export default (sequelize, DataTypes, schemas, choices, hooks) => {
    return sequelize.define(
        "SiteAssets",
        {
            key: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false,
                comment: "Asset identifier (e.g. logo)",
            },
            mime_type: {
                type: DataTypes.STRING,
                allowNull: false,
                comment: "MIME type of the stored binary (e.g. image/png)",
            },
            data: {
                type: DataTypes.BLOB("long"),
                allowNull: false,
                comment: "Raw binary bytes (BYTEA in Postgres)",
            },
            size: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: "Size in bytes",
            },
        },
        {
            tableName: "site_assets",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            schema: schemas.project,
            hooks: hooks?.siteAsset || {},
        },
    );
};
