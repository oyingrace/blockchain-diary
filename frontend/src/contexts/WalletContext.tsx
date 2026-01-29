
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { connect, disconnect } from '@stacks/connect';
import type { GetAddressesResult } from '@stacks/connect/dist/types/methods';


interface WalletContextType {
  isConnected: boolean;
