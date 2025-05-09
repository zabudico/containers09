# Лабораторная работа №9: Оптимизация Docker-образов

## Цель работы

Целью работы является знакомство с методами оптимизации Docker-образов.

## Задание

Сравнить различные методы оптимизации образов:

1. Удаление неиспользуемых зависимостей и временных файлов
2. Уменьшение количества слоев
3. Минимальный базовый образ
4. Перепаковка образа
5. Использование всех методов

## Выполнение работы

### Подготовка

1. Создан репозиторий `containers09`
2. Установлен Docker
3. Создана папка `site` и помещены в нее файлы сайта

### Метод 1: Исходный образ

Создан файл `Dockerfile.raw`:

```dockerfile
# create from ubuntu image
FROM ubuntu:latest

# update system
RUN apt-get update && apt-get upgrade -y

# install nginx
RUN apt-get install -y nginx

# copy site
COPY site /var/www/html

# expose port 80
EXPOSE 80

# run nginx
CMD ["nginx", "-g", "daemon off;"]
```

Собран образ:

```bash
docker image build -t mynginx:raw -f Dockerfile.raw .
```

### Метод 2: Удаление неиспользуемых зависимостей и временных файлов

Создан файл `Dockerfile.clean`:

```dockerfile
# create from ubuntu image
FROM ubuntu:latest

# update system
RUN apt-get update && apt-get upgrade -y

# install nginx
RUN apt-get install -y nginx

# remove apt cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# copy site
COPY site /var/www/html

# expose port 80
EXPOSE 80

# run nginx
CMD ["nginx", "-g", "daemon off;"]
```

Собран образ:

```bash
docker image build -t mynginx:clean -f Dockerfile.clean .
docker image list
```

![docker image list](images/Screenshot_clean.png)

### Метод 3: Уменьшение количества слоев

Создан файл `Dockerfile.few`:

```dockerfile
# create from ubuntu image
FROM ubuntu:latest

# update system
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y nginx && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# copy site
COPY site /var/www/html

# expose port 80
EXPOSE 80

# run nginx
CMD ["nginx", "-g", "daemon off;"]
```

Собран образ:

```bash
docker image build -t mynginx:few -f Dockerfile.few .
docker image list
```

![docker image list](images/Screenshot_few.png)

### Метод 4: Минимальный базовый образ

Создан файл `Dockerfile.alpine`:

```dockerfile
# create from alpine image
FROM alpine:latest

# update system
RUN apk update && apk upgrade

# install nginx
RUN apk add nginx

# copy site
COPY site /var/www/html

# expose port 80
EXPOSE 80

# run nginx
CMD ["nginx", "-g", "daemon off;"]
```

Собран образ:

```bash
docker image build -t mynginx:alpine -f Dockerfile.alpine .
docker image list
```

![docker image list](images/Screenshot_apline.png)

### Метод 5: Перепаковка образа

Выполнена перепаковка образа `mynginx:raw`:

```bash
docker container create --name mynginx mynginx:raw
docker container export mynginx | docker image import - mynginx:repack
docker container rm mynginx
```

### Метод 6: Использование всех методов

Создан файл `Dockerfile.min`:

```dockerfile
# create from alpine image
FROM alpine:latest

# update system, install nginx and clean
RUN apk update && apk upgrade && \
    apk add nginx && \
    rm -rf /var/cache/apk/*

# copy site
COPY site /var/www/html

# expose port 80
EXPOSE 80

# run nginx
CMD ["nginx", "-g", "daemon off;"]
```

Собран и перепакован образ:

```bash
docker image build -t mynginx:minx -f Dockerfile.min .
docker container create --name mynginx mynginx:minx
docker container export mynginx | docker image import - mynginx:min
docker container rm mynginx
```

### Результаты сравнения размеров образов

![docker image list](images/Screenshot_Image_list.png)

_Примечание: Размеры образов могут отличаться в зависимости от версий использованных образов и пакетов._

## Ответы на вопросы

### 1. Какой метод оптимизации образов вы считаете наиболее эффективным?

Наиболее эффективным методом оптимизации считаю использование минимального базового образа (Alpine). Этот метод позволил уменьшить размер образа в несколько раз по сравнению с исходным образом на базе Ubuntu.

Комбинация всех методов оптимизации (mynginx:min) дает наилучший результат, дополнительно уменьшая размер образа на базе Alpine за счет перепаковки и удаления лишних слоев.

### 2. Почему очистка кэша пакетов в отдельном слое не уменьшает размер образа?

Очистка кэша пакетов в отдельном слое не уменьшает общий размер образа из-за особенностей работы системы слоев Docker:

1. Docker использует слоистую файловую систему (overlay filesystem), где каждый слой представляет собой набор изменений по сравнению с предыдущими слоями.
2. Когда в одном слое добавляются файлы (например, при установке пакетов), а в следующем слое эти файлы удаляются (например, при очистке кэша), файлы физически остаются в историческом слое образа.
3. Хотя файлы и не видны в конечной файловой системе контейнера, они все равно хранятся внутри образа, увеличивая его размер.

Чтобы очистка действительно уменьшила размер образа, ее необходимо выполнять в том же слое, где происходит установка пакетов (используя &&). Это позволяет объединить операции установки и очистки в одну атомарную операцию в рамках одного слоя.

### 3. Что такое перепаковка образа?

Перепаковка образа (image repacking) — это процесс преобразования многослойного Docker-образа в новый образ с одним единственным слоем. Процесс включает следующие шаги:

1. Создание контейнера на основе исходного образа
2. Экспорт файловой системы контейнера в единый TAR-архив
3. Импорт этого архива как нового образа Docker

Преимущества перепаковки:

- Уменьшение размера образа за счет удаления избыточных данных, которые могут присутствовать в разных слоях
- Повышение скорости запуска контейнеров (меньше слоев для монтирования)
- Улучшение безопасности за счет удаления истории изменений, которая может содержать конфиденциальные данные

Недостатки:

- Потеря истории слоев и метаданных
- Отсутствие возможности инкрементального обновления образа
- Увеличение времени сборки при обновлении образа (придется перепаковывать весь образ)

## Выводы

В ходе лабораторной работы были изучены и сравнены различные методы оптимизации Docker-образов. Ключевые выводы:

1. Выбор базового образа имеет наибольшее влияние на конечный размер образа. Использование легковесных дистрибутивов вроде Alpine вместо полноценных дистрибутивов вроде Ubuntu значительно уменьшает размер.

2. Объединение команд установки и очистки в один слой является критически важным для уменьшения размера образа. Это позволяет избежать хранения временных файлов в истории слоев.

3. Перепаковка образа помогает дополнительно оптимизировать размер, но приводит к потере возможности инкрементальных обновлений.

4. Комбинация всех методов оптимизации дает наилучший результат с точки зрения минимизации размера образа.

5. При разработке Dockerfile важно учитывать не только функциональность, но и оптимизацию размера и производительности образа.

Эти методы оптимизации Docker-образов имеют практическую значимость для разработки и развертывания приложений, особенно в условиях ограниченных ресурсов или при необходимости быстрой передачи образов по сети.
