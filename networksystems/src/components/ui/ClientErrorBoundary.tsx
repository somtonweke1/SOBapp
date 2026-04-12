'use client';

import React from 'react';

type Props = {
  children: React.ReactNode;
  fallback: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ClientErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('ClientErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

