'use client';
import { createContext, useContext } from 'react';

export const DarkCtx = createContext(false);
export const useDark = () => useContext(DarkCtx);
