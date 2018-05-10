export default {
    $ref: '#/definitions/GlobResolverConfig',
    $schema: 'http://json-schema.org/draft-06/schema#',
    definitions: {
        CustomizedGlob: {
            additionalProperties: false,
            properties: {
                options: {
                    $ref: '#/definitions/PartialGlobOptions'
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
        GlobResolver: {
            additionalProperties: false,
            properties: {
                input: {
                    $ref: '#/definitions/GlobInput'
                },
                options: {
                    $ref: '#/definitions/PartialGlobOptions'
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
        PartialGlobOptions: {
            additionalProperties: false,
            description: 'Make all properties in T optional',
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
                    default: false,
                    type: 'boolean'
                },
                nocase: {
                    default: false,
                    type: 'boolean'
                },
                noext: {
                    default: false,
                    type: 'boolean'
                },
                noglobstar: {
                    default: false,
                    type: 'boolean'
                },
                nonegate: {
                    default: false,
                    type: 'boolean'
                },
                unescape: {
                    default: false,
                    type: 'boolean'
                }
            },
            type: 'object'
        },
        SingleGlob: {
            type: 'string'
        }
    }
};
