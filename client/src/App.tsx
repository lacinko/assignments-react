import { Container } from "./components/Container";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { List } from "./components/List";
import { ListItem } from "./components/ListItem";
import { Layout } from "./components/Layout";
import { Toast } from "./components/Toast";
import { useTodos } from "./hooks/useTodos";
import "./global.css";

export const App = () => {
    const {
        items,
        isLoading,
        error,
        todoCount,
        doneCount,
        addItem,
        editLabel,
        toggleDone,
        deleteItem,
        retry,
        dismissError,
    } = useTodos();

    return (
        <Container>
            <Layout>
                <Header onItemAdd={addItem}>To Do app</Header>
                {/* Decision #11: dismissible error toast with retry, above the still-visible list. */}
                {error && <Toast message={error} onRetry={retry} onDismiss={dismissError} />}
                <List>
                    {isLoading && <p>Loading…</p>}
                    {!isLoading &&
                        items.map((item) => (
                            <ListItem
                                key={item.id}
                                label={item.label}
                                isDone={item.isDone}
                                onItemLabelEdit={(label) => editLabel(item.id, label)}
                                onItemDoneToggle={(isDone) => toggleDone(item.id, isDone)}
                                onItemDelete={() => deleteItem(item.id)}
                            />
                        ))}
                </List>
                <Footer todoItems={todoCount} doneItems={doneCount} />
            </Layout>
        </Container>
    );
};
