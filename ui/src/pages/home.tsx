"use client";
import { PublicKey } from "../../../contracts/build/src/minapatrons";
import { useEffect, useState } from "react";
import "../reactCOIServiceWorker";
import styles from "../styles/Home.module.css";
import ZkappWorkerClient from "../zkappWorkerClient";
import axios from "axios";

const zkappAddress = "B62qnqkDn5RHhWVC3PStcw6V18FjZtTzdsGw7UXEo8pgET54BPmgkff";
const transactionFee = 0;

export default function Home() {
  const [state, setState] = useState({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    hasBeenSetup: false,
    accountExists: false,
    publicKey: null as null | PublicKey,
    zkappPublicKey: null as null | PublicKey,
    creatingTransaction: false,
  });

  const [posts, setPosts] = useState([]);
  const [unlockedPosts, setUnlockedPosts] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    ContentName: "",
    ContentData: "",
    pk: "",
    nullifier: "",
    price: "",
  });

  useEffect(() => {
    const setupZkApp = async () => {
      const { PublicKey } = await import(
        "../../../contracts/build/src/minapatrons"
      );
      if (!state.hasBeenSetup) {
        const zkappWorkerClient = new ZkappWorkerClient();
        await zkappWorkerClient.setActiveInstanceToDevnet();

        const mina = (window as any).mina;
        if (!mina) {
          setState({ ...state, hasWallet: false });
          return;
        }

        const publicKeyBase58: string = (await mina.requestAccounts())[0];
        const publicKey = PublicKey.fromBase58(publicKeyBase58);

        const zkappPublicKey = PublicKey.fromBase58(zkappAddress);
        await zkappWorkerClient.loadContract();
        await zkappWorkerClient.compileContract();
        await zkappWorkerClient.initZkappInstance(zkappPublicKey.toBase58());

        setState({
          ...state,
          zkappWorkerClient,
          hasWallet: true,
          hasBeenSetup: true,
          publicKey,
          zkappPublicKey,
        });

        /* const unlockedData = await axios.get("/api/get_content.ts", {
          params: { publickey: state.publicKey!.toBase58() },
        });
        setUnlockedPosts(unlockedData.data.map((post: any) => post.id));
        */
      }
    };
    // fetchPosts();
    setupZkApp();
  }, [state]);

  const fetchPosts = async () => {
    try {
      const { data } = await axios.get("/api/get_content");
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("price", formData.price);
      formDataToSend.append("ContentName", formData.ContentName);
      formDataToSend.append("nullifier", formData.nullifier);
      formDataToSend.append("pk", formData.pk);
      formDataToSend.append("ContentData", formData.ContentData);

      await axios.post("/api/add_contents", formDataToSend);

      setFormData({
        ContentName: "",
        ContentData: "",
        pk: "",
        nullifier: "",
        price: "",
      });

      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleBuyPost = async (postId: string, price: string) => {
    try {
      await state.zkappWorkerClient!.fetchAccount(state.publicKey!.toBase58());
      await state.zkappWorkerClient!.createBuyTransaction(
        postId,
        price,
        state.publicKey!.toBase58()
      );
      await state.zkappWorkerClient!.proveUpdateTransaction();

      const transactionJSON =
        await state.zkappWorkerClient!.getTransactionJSON();
      const { hash } = await (window as any).mina.sendTransaction({
        transaction: transactionJSON,
        feePayer: {
          fee: transactionFee,
          memo: "",
        },
      });

      alert(`Transaction successful: https://minaexplorer.com/tx/${hash}`);
      // Add the post to the unlocked posts
      setUnlockedPosts((prev) => [...prev, postId]);
    } catch (error) {
      console.error("Error buying post:", error);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>MINAPATRONS</h1>

      <form className={styles.form} onSubmit={handleCreatePost}>
        <div className={styles.inputGroup}>
          <label htmlFor="price">Price</label>
          <input
            type="text"
            name="price"
            id="price"
            placeholder="Enter Price"
            value={formData.price}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="ContentName">Content Name</label>
          <input
            type="text"
            name="ContentName"
            id="ContentName"
            placeholder="Enter Content Name"
            value={formData.ContentName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="nullifier">Nullifier</label>
          <input
            type="text"
            name="nullifier"
            id="nullifier"
            placeholder="Enter Nullifier"
            value={formData.nullifier}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="pk">Private Key</label>
          <input
            type="text"
            name="pk"
            id="pk"
            placeholder="Enter Private Key"
            value={formData.pk}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="ContentData">Content Data</label>
          <input
            type="text"
            name="ContentData"
            placeholder="Content Data"
            value={formData.ContentData}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit" className={styles.createButton}>
          Create Post
        </button>
      </form>

      <div className={styles.posts}>
        {posts.map((post: any) => (
          <div key={post.id} className={styles.post}>
            <h2>{post.contentName}</h2>
            <p className={styles.price}>Price: {post.price}</p>
            {post.image && (
              <div className={styles.imageWrapper}>
                <img
                  src={`data:image/jpeg;base64,${post.image}`}
                  alt={post.contentName}
                  className={styles.image}
                />
                {!unlockedPosts.includes(post.id) && (
                  <div className={styles.overlay}>
                    <p>Unlocked</p>
                  </div>
                )}
              </div>
            )}
            {!unlockedPosts.includes(post.id) && (
              <button
                className={styles.buyButton}
                onClick={() => handleBuyPost(post.id, post.price)}
              >
                Buy & Unlock
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
