import { BookOpen, ChevronDown, Code, ExternalLink, Search } from 'lucide-react'
import type React from 'react'
import { type JSX, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * 外部服务配置接口
 */
interface ExternalService {
  name: string
  description: string
  icon: React.ReactNode
  urlTemplate: string
  category: 'ide' | 'search' | 'ai' | 'analysis'
}

/**
 * 外部服务列表配置
 */
const EXTERNAL_SERVICES: ExternalService[] = [
  {
    name: 'Zread',
    description: 'AI 知识管理工具，个人知识库',
    icon: <BookOpen className="w-4 h-4" />,
    urlTemplate: 'https://zread.ai/{owner}/{repo}',
    category: 'ai',
  },
  {
    name: 'Deepwiki',
    description: '基于 AI 的知识库，项目文档管理',
    icon: <BookOpen className="w-4 h-4" />,
    urlTemplate: 'https://deepwiki.com/{owner}/{repo}',
    category: 'ai',
  },
  // {
  //   name: 'Bloop.ai',
  //   description: 'AI 代码搜索引擎，自然语言搜索',
  //   icon: <Brain className="w-4 h-4" />,
  //   urlTemplate: 'https://bloop.ai/search?q=repo:{owner}/{repo}',
  //   category: 'ai',
  // },
  {
    name: 'GitHub1s',
    description: '在网页版 VS Code 环境中浏览代码',
    icon: <Code className="w-4 h-4" />,
    urlTemplate: 'https://github1s.com/{owner}/{repo}',
    category: 'ide',
  },
  // {
  //   name: 'Gitpod',
  //   description: '云端在线 IDE，完整开发环境',
  //   icon: <Zap className="w-4 h-4" />,
  //   urlTemplate: 'https://gitpod.io/#{url}',
  //   category: 'ide',
  // },
  // {
  //   name: 'CodeSandbox',
  //   description: '在线代码编辑器和原型工具',
  //   icon: <Globe className="w-4 h-4" />,
  //   urlTemplate: 'https://codesandbox.io/s/github/{owner}/{repo}',
  //   category: 'ide',
  // },
  {
    name: 'Sourcegraph',
    description: '强大的代码搜索和导航引擎',
    icon: <Search className="w-4 h-4" />,
    urlTemplate: 'https://sourcegraph.com/github.com/{owner}/{repo}',
    category: 'search',
  },
]

/**
 * 从当前URL解析GitHub仓库信息
 */
function parseGitHubRepo(): {
  owner: string
  repo: string
  url: string
} | null {
  const pathname = window.location.pathname
  const match = pathname.match(/^\/([^/]+)\/([^/]+)/)

  if (!match) return null

  const [, owner, repo] = match
  return {
    owner,
    repo: repo.replace(/\.git$/, ''), // 移除可能的.git后缀
    url: window.location.href,
  }
}

/**
 * 生成外部服务的URL
 */
function generateServiceUrl(
  service: ExternalService,
  repoInfo: { owner: string; repo: string; url: string },
): string {
  return service.urlTemplate
    .replace('{owner}', repoInfo.owner)
    .replace('{repo}', repoInfo.repo)
    .replace('{url}', repoInfo.url)
}

/**
 * GitHub增强器主组件
 */
export function GitHubEnhancer(): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false)
  const [repoInfo, setRepoInfo] = useState<{
    owner: string
    repo: string
    url: string
  } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 解析当前仓库信息
  useEffect(() => {
    const info = parseGitHubRepo()
    setRepoInfo(info)
  }, [])

  // 点击外部区域关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // 如果不是仓库页面，不显示组件
  if (!repoInfo) {
    return null
  }

  // 按类别分组服务
  const servicesByCategory = EXTERNAL_SERVICES.reduce(
    (acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = []
      }
      acc[service.category].push(service)
      return acc
    },
    {} as Record<string, ExternalService[]>,
  )

  const categoryLabels = {
    ide: '在线 IDE',
    search: '代码搜索',
    ai: 'AI 工具',
    analysis: '代码分析',
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-8 px-3 text-xs font-medium',
          'border-gray-300 bg-white hover:bg-gray-50',
          'text-gray-700 hover:text-gray-900',
          'shadow-sm transition-all duration-200',
          isOpen && 'bg-gray-50 border-gray-400',
        )}
      >
        <ExternalLink className="w-3 h-3 mr-1" />
        快速访问
        <ChevronDown
          className={cn(
            'w-3 h-3 ml-1 transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </Button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-1 w-72 z-50',
            'bg-white border border-gray-200 rounded-md shadow-lg',
            'py-2 max-h-96 overflow-y-auto',
          )}
        >
          {Object.entries(servicesByCategory).map(([category, services]) => (
            <div key={category} className="mb-2 last:mb-0">
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </div>
              {services.map((service) => {
                const url = generateServiceUrl(service, repoInfo)
                return (
                  <a
                    key={service.name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center px-3 py-2 text-sm',
                      'hover:bg-gray-50 transition-colors duration-150',
                      'text-gray-700 hover:text-gray-900',
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center justify-center w-8 h-8 mr-3 bg-gray-100 rounded-md">
                      {service.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {service.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {service.description}
                      </div>
                    </div>
                    <ExternalLink className="w-3 h-3 text-gray-400 ml-2 flex-shrink-0" />
                  </a>
                )
              })}
            </div>
          ))}

          <div className="border-t border-gray-100 mt-2 pt-2 px-3">
            <div className="text-xs text-gray-500">
              当前仓库:{' '}
              <span className="font-mono">
                {repoInfo.owner}/{repoInfo.repo}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
