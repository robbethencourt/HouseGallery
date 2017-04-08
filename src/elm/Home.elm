module Home exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)


-- model


type alias Model =
    { error : Maybe String }


initModel : Model
initModel =
    { error = Nothing }


init : ( Model, Cmd Msg )
init =
    ( initModel, Cmd.none )



-- update


type Msg
    = SignupPage


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        SignupPage ->
            ( model, Cmd.none )



-- view


view : Model -> Html Msg
view model =
    div []
        [ div [ class "jumbotron" ]
            [ h1 [] [ text "houseable" ]
            , p [] [ text "save, share and sell your art collection online" ]
            , button [] [ text "sign up" ]
            ]
        ]



-- subscriptions


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none
