import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-text-primary">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
            <h1 className="text-2xl font-extrabold text-danger">Oops! Something went wrong</h1>
            <p className="mt-3 text-sm text-text-secondary">
              We've encountered an unexpected error. Please try reloading the page.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleReload}
                className="rounded-xl bg-primary px-6 py-2.5 font-bold text-white transition hover:bg-primary-hover"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
