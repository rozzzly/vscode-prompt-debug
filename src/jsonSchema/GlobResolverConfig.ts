export default {
    $ref: '#/definitions/GlobResolverConfig',
    $schema: 'http://json-schema.org/draft-06/schema#',
    definitions: {
        CustomizedGlob: {
            additionalProperties: false,
            properties: {
                options: {
                    $ref: '#/definitions/GlobOptions'
                },
                pattern: {
                    anyOf: [
                        {
                            $ref: '#/definitions/SingleGlob'
                        },
                        {
                            $ref: '#/definitions/MultiGlob'
                        }
                    ]
                }
            },
            required: ['pattern'],
            type: 'object'
        },
        GlobInput: {
            anyOf: [
                {
                    $ref: '#/definitions/SingleGlob'
                },
                {
                    $ref: '#/definitions/CustomizedGlob'
                },
                {
                    items: {
                        anyOf: [
                            {
                                $ref: '#/definitions/SingleGlob'
                            },
                            {
                                $ref: '#/definitions/CustomizedGlob'
                            }
                        ]
                    },
                    type: 'array'
                }
            ]
        },
        GlobOptions: {
            additionalProperties: false,
            properties: {
                basename: {
                    default: false,
                    type: 'boolean'
                },
                bash: {
                    default: true,
                    type: 'boolean'
                },
                dot: {
                    default: false,
                    type: 'boolean'
                },
                ignore: {
                    anyOf: [
                        {
                            type: 'string'
                        },
                        {
                            items: {
                                type: 'string'
                            },
                            type: 'array'
                        }
                    ]
                },
                nobrace: {
                    type: 'boolean'
                },
                nocase: {
                    type: 'boolean'
                },
                noext: {
                    type: 'boolean'
                },
                noglobstar: {
                    type: 'boolean'
                },
                nonegate: {
                    type: 'boolean'
                },
                unescape: {
                    type: 'boolean'
                }
            },
            type: 'object'
        },
        GlobResolver: {
            additionalProperties: false,
            properties: {
                input: {
                    $ref: '#/definitions/GlobInput'
                },
                options: {
                    $ref: '#/definitions/GlobOptions'
                },
                output: {
                    type: 'string'
                }
            },
            required: ['input', 'output'],
            type: 'object'
        },
        GlobResolverConfig: {
            anyOf: [
                {
                    $ref: '#/definitions/GlobResolver'
                },
                {
                    items: {
                        $ref: '#/definitions/GlobResolver'
                    },
                    type: 'array'
                }
            ]
        },
        MultiGlob: {
            items: {
                $ref: '#/definitions/SingleGlob'
            },
            type: 'array'
        },
        SingleGlob: {
            type: 'string'
        }
    }
};
