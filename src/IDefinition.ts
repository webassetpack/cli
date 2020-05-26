
export interface IDefinition {
    /**
     * The path to the file
     * @required
     */
    path: string;

    /**
     * The mime type. If not set, common set will be used based on mime type.
     * If extension is not recognizable, `application/octet-stream` will be used as
     * a last resort.
     * @optional
     */
    type?: string;
}
