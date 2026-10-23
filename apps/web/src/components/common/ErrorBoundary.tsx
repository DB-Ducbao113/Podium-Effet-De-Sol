import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL REACT ERROR CAUGHT BY ERRORBOUNDARY:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearStorageAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-2xl w-full bg-[#18181b] border border-red-500/30 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-red-400 font-bold">
                  F1 SYSTEM PIT-STOP ERROR
                </span>
                <h1 className="text-2xl font-black tracking-tight text-white mt-0.5">
                  Đã xảy ra sự cố hiển thị (Render Crash)
                </h1>
              </div>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              Ứng dụng vừa gặp một lỗi xử lý dữ liệu giao diện không mong muốn. Để tránh gián đoạn
              trải nghiệm, bạn có thể thử tải lại hoặc xóa bộ nhớ tạm để hệ thống đồng bộ lại từ
              đầu.
            </p>

            {this.state.error && (
              <div className="bg-black/60 border border-zinc-800 rounded-xl p-4 text-xs font-mono text-red-300 overflow-x-auto max-h-48">
                <p className="font-bold mb-1 text-red-400">{this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[10px] text-zinc-500 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-600/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tải lại trang</span>
              </button>

              <button
                onClick={this.handleClearStorageAndReload}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase tracking-wider transition-all border border-zinc-700 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-zinc-400" />
                <span>Xóa dữ liệu đệm & Khôi phục</span>
              </button>

              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-all ml-auto"
              >
                <Home className="w-4 h-4" />
                <span>Trang chủ</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
