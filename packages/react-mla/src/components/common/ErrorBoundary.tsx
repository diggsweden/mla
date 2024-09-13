// SPDX-FileCopyrightText: 2024 Skatteverket - Swedish Tax Agency
//
// SPDX-License-Identifier: CC0-1.0

import { Component, type ErrorInfo } from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  componentDidCatch (error: Error, errorInfo: ErrorInfo) {
    console.error('Something broke: ', error, errorInfo)
    this.setState({ hasError: true })
  }

  render () {
    if (this.state.hasError) {
      return <h1>An error occured</h1>
    }

    return this.props.children
  }
}

export default ErrorBoundary
