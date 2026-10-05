# AGENTS.md — Mevdad Portfolio — Artem Kalinichenko

MCP server: `project_agents` (http://127.0.0.1:28765/mcp)
Project ID: `mevdad-portfolio`
Profile version: `0ae088890d50435ef21180ca1439b4e02b1d43ab8e7a11d523d2754d057d265a`

## Project

Stack: Next.js 15 (App Router, static export), React 19, TypeScript strict, Tailwind CSS v4, Motion (framer-motion) для анимаций, Lenis (smooth scroll), pnpm, GitHub Pages + GitHub Actions

Architecture: Одностраничный (single-page, секции-якоря) статический сайт-портфолио, output: 'export', деплой на GitHub Pages (user site mevdad.github.io, корень домена, без basePath). Структура: src/app (layout, page, globals.css, sitemap/robots), src/components (sections/, ui/, motion/), src/content (типизированные данные из CV: profile.ts, skills.ts, experience.ts, projects.ts), src/lib. Контент отделён от разметки — секции читают данные из src/content. Server Components по умолчанию; 'use client' только для интерактивных/анимированных островков. Анимации: reveal-on-scroll, stagger hero, параллакс, magnetic-кнопки, анимированные счётчики, marquee стека, плавный скролл; обязательна поддержка prefers-reduced-motion. Тёмная тема по умолчанию + переключатель. Без бэкенда: контакт через mailto/Telegram/Freelancehunt ссылки.

## Project constraints

- Только static export (output: 'export'), никаких API routes/SSR/middleware — хостинг GitHub Pages
- Не выдумывать факты, цифры и проекты — только из Artem_Kalinichenko_FullStack_CV_2.docx
- Анимации только через transform/opacity; обязательна поддержка prefers-reduced-motion
- 'use client' минимально — только для интерактивных островков
- TypeScript strict, без any
- Тяжёлые зависимости не добавлять без обоснования (бюджет JS на первую загрузку ~150KB gzip)
- Контент хранить в src/content, не хардкодить в компонентах
- Не коммитить секреты; личные контакты — только те, что есть в CV
- Не пушить в main напрямую — через ветку и PR

## Verification commands

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

## Required context

- Artem_Kalinichenko_FullStack_CV_2.docx
- README.md

## Совместимость клиента

Этот workflow использует стандартные MCP tools и модель, выбранную клиентом, независимо от провайдера. Имена ролей обозначают обязанности. Клиент подключает Streamable HTTP MCP, загружает AGENTS.md через свой механизм инструкций и предоставляет инструменты для локальной работы. Субагенты необязательны; при их отсутствии роли выполняются последовательно. Файлы для конкретного клиента создавай только при использовании этого клиента.

## Работа через общий MCP project_agents

1. В начале задачи прочитай этот файл и локальные спецификации. Вызови `get_context` с project_id, задачей, текущим Git commit (если есть) и role="auto". Обязательные документы прочитай через `read_document`; при необходимости используй `search_knowledge`.
2. Сверь серверные документы с текущей веткой. Спецификации и ADR синхронизируй через `save_document` с точной revision. Несовпадение версии означает, что документ нужно проверить, а не считать актуальным.
3. Используй возвращённые instructions и execution_agents. Если клиент поддерживает субагентов, запусти нужную роль с задачей, контекстом и критериями приёмки. Иначе выполни роль последовательно в текущей сессии. MCP предоставляет знания; код и команды выполняются в локальном проекте.
4. Выполни изменение, запусти реальные проверки и организуй независимое ревью по reviewer. Проверки исполняй локально; описание команды в MCP не является результатом её выполнения.
5. Вызови `propose_result` с итогом, revision, фактическими результатами проверок и выводами с доказательствами и условиями применимости. Покажи пользователю итог и предложенные знания; сервер возвращает result_id и digest.
6. Только после явного принятия этого результата пользователем вызови `approve_result` с result_id, expected_digest и точной цитатой принятия. Общие знания из другого проекта служат примерами, а не меняют правила этого проекта. Выводы сохраняются в разделе проекта; общий стандарт меняется отдельно через `promote_learning` после явного согласования.

При изменении архитектуры прочитай `get_project`, затем обнови профиль через `onboard_project` с expected_version и заново вызови `generate_agents`. Если MCP недоступен, сообщи об этом и используй локальные документы; не выдумывай серверные требования.
