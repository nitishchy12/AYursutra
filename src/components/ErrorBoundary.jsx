import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container page">
          <div className="empty-state">
            <h2>Something went wrong</h2>
            <p>Please refresh the page or return to the dashboard.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
