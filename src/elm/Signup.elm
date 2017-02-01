port module Signup exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import Json.Encode as JE
import Navigation


-- model


type alias Model =
    { username : String
    , email : String
    , password : String
    , error : Maybe String
    }


initModel : Model
initModel =
    { username = ""
    , password = ""
    , email = ""
    , error = Nothing
    }


init : ( Model, Cmd Msg )
init =
    ( initModel, Cmd.none )



-- update


type Msg
    = UsernameInput String
    | EmailInput String
    | PasswordInput String
    | Submit
    | Error String
    | UserSaved String


update : Msg -> Model -> ( Model, Cmd Msg, Maybe String )
update msg model =
    case msg of
        UsernameInput username ->
            ( { model | username = username }, Cmd.none, Nothing )

        EmailInput email ->
            ( { model | email = email }, Cmd.none, Nothing )

        PasswordInput password ->
            ( { model | password = password }, Cmd.none, Nothing )

        Submit ->
            let
                body =
                    JE.object
                        [ ( "username", JE.string model.username )
                        , ( "email", JE.string model.email )
                        , ( "password", JE.string model.password )
                        ]
                        |> JE.encode 4

                cmd =
                    saveUser body
            in
                ( model, cmd, Nothing )

        Error error ->
            ( { model | error = Just error }, Cmd.none, Nothing )

        UserSaved fbData ->
            ( { model
                | username = ""
                , email = ""
                , password = ""
              }
            , Navigation.newUrl "#/gallery"
            , Just fbData
            )


view : Model -> Html Msg
view model =
    div [ class "main" ]
        [ errorPanel model.error
        , signupForm model
        , p [] [ text (toString model) ]
        ]


signupForm : Model -> Html Msg
signupForm model =
    div [ class "row" ]
        [ div [ class "col-md-6 col-md-offset-3" ]
            [ h2 [] [ text "Signup" ]
            , Html.form [ class "signup-login", onSubmit Submit ]
                [ label [] [ text "Username" ]
                , div [ class "form-group" ]
                    [ input
                        [ type_ "text"
                        , class "form-control"
                        , value model.username
                        , onInput UsernameInput
                        ]
                        []
                    ]
                , label [] [ text "Email" ]
                , div [ class "form-group" ]
                    [ input
                        [ type_ "email"
                        , class "form-control"
                        , value model.email
                        , onInput EmailInput
                        ]
                        []
                    ]
                , label [] [ text "Password" ]
                , div [ class "form-group" ]
                    [ input
                        [ type_ "password"
                        , class "form-control"
                        , value model.password
                        , onInput PasswordInput
                        ]
                        []
                    ]
                , div [ class "form-group" ]
                    [ label [] []
                    , button
                        [ type_ "submit"
                        , class "btn btn-default"
                        ]
                        [ text "Signup" ]
                    ]
                ]
            ]
        ]


errorPanel : Maybe String -> Html a
errorPanel error =
    case error of
        Nothing ->
            text ""

        Just msg ->
            div [ class "error" ]
                [ text msg ]



-- subscriptions


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ userSaved UserSaved ]


port saveUser : String -> Cmd msg


port userSaved : (String -> msg) -> Sub msg