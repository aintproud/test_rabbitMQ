##### Запуск rabbitmq

* Нужно подгрузить библиотеки `npm ci`
* Я подгружаю image rabbitmq `docker pull rabbitmq`
* И запускаю контейнер `docker run -d --name my-rabbit -p 5672:5672 rabbitmq`

##### Запускаем микросервисы

* `node 1`
* `node 2`

##### Отправляем запрос

* ```
  curl --location --request GET 'http://localhost:3000' \
  --header 'Content-Type: application/json' \
  --data '{
      "repo": "monkeytypegame/monkeytype"
  }'
  ```

Приложение отдает коммиты по репозиторию github. Можно изменить тело запроса
