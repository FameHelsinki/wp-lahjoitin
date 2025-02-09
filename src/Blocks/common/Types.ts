import React from 'react'

export type Control<T = {}, P = {}> = React.FC<T> & { Content: React.FC<P> }
