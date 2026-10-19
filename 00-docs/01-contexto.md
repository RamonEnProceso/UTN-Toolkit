## ¿Qué es?
Una aplicación web que te permite crear diagramas a partir de pseudocódigo.

## ¿Para qué?
Permite a los usuarios crear diagramas del funcionamiento de sus aplicaciones de forma sencilla. 
Además, permite a estudiantes de UTN diagramar de forma sencilla solo con tener el pseudocódigo armado.

## ¿Cómo funciona?
En una casilla de texto, se identifican las palabras claves, por renglon y espaciado, y se derivan a su respectiva forma en un canvas que lo va armando. Al finalizar el pseudocódigo, a la par queda armado el respectivo diagrama. A medida que se agregan 

Ejemplo:
```
- main():
    - Leer numero
    - Imprimir numero

```

## Equivalencias (palabra inicial clave)
Ingresar datos:
    > Trapecio con base superior
    - Leer
    - Ingresar
    - Abrir
    Mostrar datos:
    > Trapecio con base inferior
    - Imprimir
    - Mostrar
    - Escribir
Rectangulo contenedor:
    Condicional SI/SINO:
        > Rectangulo con la condicion arriba y luego dividido en dos partes (izquierda SI, derecha SINO)
        - Si
        - Sino (Si no existe, el area derecha mide 10%)
        ```
        -Si x = 0
            - Devolver 1
        -Sino
            - Devolver -1
        ```
    Condicional SWITCH:
        > Rectangulo con el nombre de la variable arriba y luego dividido entre la cantidad de posibilidades
        - Cuando x sea
        ```
        - Cuando mes sea
            - 1-3
                - Devolver "Verano"
            - 4-6
                - Devolver "Otoño" 
        ```
    Bucle WHILE:
        > Rectangulo con el nombre de la condicion y luego dentro las respectivas acciones
        - Mientras x
    Bucle FOR:
        > Rectangulo con el nombre de la condicion y luego dentro las respectivas acciones
        - Para i -> 0 mientras i < x
Hexágono alargado:
    Funciones:
    > Hexágono alargado separado por la mitad, arriba el nombre de la funcion y abajo los distintos outputs e inputs.
    > Tambien pueden llamarse individualmente y asignar a una variable
    > main() NUNCA se muestra como un hexagono ya que es la inicial
    > `v` se muestra como una flecha para abajo, `^` como una flecha para arriba y `v^` como una flecha señalando arriba y abajo
    - funcion(input v, output^)
    ```
    - imprimirTexto(texto v)
        - Imprimir texto
    
    - devolverSuma(num1 v, num2 v, suma ^)
        - Devolver num1 + num2

    - main()
        - suma <- devolverSuma(1 v, 2 v)
        - imprimirTexto(suma v)
    ```
Circulos:
    > Cierran o abren las funciones
    > Todas las funciones secundarias, muestran un circulo con una `F` dentro, señalando que finalizó
    > Las funciones main también cuentan con la `F` al final pero también con un circulo `I` arriba de todo, para señalar que comenzó
Las acciones no reconocidas solo serán el renglon dentro de un rectángulo.
    ```
    - suma <- num1 + num2
    ```
## Reglas
- Los `=` se usan para comparar
- Los `<-` para asignar a una variable
- Los `->` se usan para leer una variable de un **struct**
- Los **structs** se asignan entre `{}`
    ```
    - dni <- {nombre, apellido, codigo}
    ```