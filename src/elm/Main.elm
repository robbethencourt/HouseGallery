module Main exposing (..)

import Html exposing (..)


-- model


type alias Model =
    { content : String }


initialModel : Model
initialModel =
    { content = "" }



-- update


type Msg
    = Input String
    | Something


update : Msg -> Model -> Model
update msg model =
    case msg of
        _ ->
            model



-- view


view : Model -> Html Msg
view model =
    div [] [ p [] [ text "hello world" ] ]



-- app


main : Program Never Model Msg
main =
    Html.beginnerProgram
        { model = initialModel
        , view = view
        , update = update
        }
