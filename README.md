# ru-unesp
[Projeto de TCC](https://drive.google.com/file/d/11iexLLQwmG_AlxCW5669dcAnTZVjfohY/view?usp=sharing) - Mobile app feito em Ionic3 para o uso do RU da UNESP Bauru.

Projeto em andamento com previsão de término para Dezembro/2017.

# Instalação

1. Necessário possuir [node.js](https://nodejs.org/en/)

2. Instalar as dependências do `Ionic`- Para a instalação em outros sistemas, [clique aqui](http://ionicframework.com/docs/intro/installation/)

```
#Para sistemas linux
sudo npm install -g cordova
sudo npm install -g ionic
```


3. Clonar o repositórioe instalar as dependências do `npm`
```
git clone https://github.com/luizcieslak/ru-unesp.git
cd ru-unesp
npm install
```

4 - Criar um arquivo na pasta raiz chamado `firebase-config.ts`. Em seguida, adicionar as seguintes informações:
```
export const FirebaseConfig = {
    apiKey: "AIzaSyDBehRyedcZh1tRknKB_H1Foz52n-sGmE0",
    authDomain: "unespru-test.firebaseapp.com",
    databaseURL: "https://unespru-test.firebaseio.com",
    projectId: "unespru-test",
    storageBucket: "unespru-test.appspot.com",
    messagingSenderId: "1034227533456"
};
```

5 - Para executar, execute o comando `ionic serve` no terminal dentro da pasta `ru-unesp`.

# Licença

Este software segue as regras da GNU General Public License v3.0. [ver mais](https://www.gnu.org/licenses/gpl-3.0.en.html)
