import { Link } from 'react-router-dom';
import Logo from '@/components/common/Logo';
import { siteConfig } from '@/config/site';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Logo className="mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
              {siteConfig.description}
            </p>
          </div>

          {/* Links - Documentation */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">文档</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/docs"
                  className="text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  快速开始
                </Link>
              </li>
              <li>
                <Link
                  to="/docs"
                  className="text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  API 参考
                </Link>
              </li>
              <li>
                <Link
                  to="/docs"
                  className="text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  部署指南
                </Link>
              </li>
            </ul>
          </div>

          {/* Links - Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">资源</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={siteConfig.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link
                  to="/docs"
                  className="text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  常见问题
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © {currentYear} {siteConfig.creator} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
